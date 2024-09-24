const express = require('express');
const { Spot, User, Booking, Review, ReviewImage, SpotImage, Sequelize } = require ('../../db/models')
const router = express.Router();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

// Add average rating and preview image urls to current query------------------------
const addAvgRatingAndPreviewImage = {
    attributes: {
        include: [
          [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgRating'],   //add avgRating to each spot from reviews
          [Sequelize.col('SpotImages.url'), 'previewImage']  //add previewImage's url from spotImages column
        ]
      },
      include: [
        {
            model: Review, // Include the Review model to calculate the average
            attributes: [] // No need to fetch all review attributes, just calculate average
        },
        {
            model: SpotImage, // Include the SpotImage model to get the image URL
            attributes: [], // No need to fetch all image attributes, just include the URL
            where: { preview: true },  // Only get the preview image
            required: false // Allow spots without images
        }
      ],
    group: ['Spot.id', 'SpotImages.id'],
}
// Ziwen ^^^-------------------------------------------------------------------


// Authorization Test by spotId belongs to current user------------------------
// const authorizationTest = async function(req, res, next) {
//     const userId = req.user.id;
//     const spot = await Spot.findOne({
//         where: { id: req.params.spotId }
//         });
//     // Check if the spot exists
//     if (!spot) {
//         return res.status(404).json({ "message": "Spot couldn't be found" });
//     }
//     // Check if user is the owner of the spot
//     const spotOwnerId = spot.ownerId;
//     if (userId !== spotOwnerId) {
//         return res.status(403).json({ "message": "Forbidden" });
//     }
//     next();
// }
// Ziwen ^^^----------------------------------------------------------------

// get all spots--------------------------------------------------------------
router.get('/', async (req, res) => {
    const spots = await Spot.findAll({...addAvgRatingAndPreviewImage});
    res.json({ spots });
  });

// Ziwen ^^^----------------------------------------------------------------------

// Get all Spots owned by the Current User-----------------------------------------------
router.get('/current', requireAuth, async (req,res) =>{
        const userId = req.user.id
        const Spots = await Spot.findAll({
            where:{ownerId:userId},
            ...addAvgRatingAndPreviewImage
        })
        res.json({
            Spots
        })
})
// Ziwen ^^^--------------------------------------------------------------------------

// Get details of a Spot from an id---------------------------------------------------
router.get('/:spotId', async(req,res) =>{
    const spotId = req.params.spotId
    try {
        const spot = await Spot.findOne({
            where:{id:spotId},
            attributes:{
                include: [
                    [Sequelize.fn('COUNT', Sequelize.col('Reviews.stars')), 'numReviews'],
                    [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgRating']
                ]
            },
            include:[
                {model:Review, attributes:[]},
                {model:SpotImage, attributes:['id','url','preview']},
                {
                model: User,
                as: 'Owner', 
                attributes: ['id', 'firstName', 'lastName']
                }
            ],
            group: ['Spot.id', 'SpotImages.id', 'Owner.id']
        })
        if(!spot){
            return res.status(404).json({ message:"Spot couldn't be found" })
        }
        res.json({spot})
    } catch (error) {
        return res.status(404).json({ message:"Spot couldn't be found" })
    }
    
})
// Ziwen ^^^ -------------------------------------------------------------------------

// Create a Spot-------------------------------------------------------------------------
const validateSpot = [
    check('address')
        .notEmpty()
        .withMessage('Street address is required'),
    check('city')
        .notEmpty()
        .withMessage('City is required'),
    check('state')
        .notEmpty()
        .withMessage('State is required'),
    check('country')
        .notEmpty()
        .withMessage('Country is required'),
    check('lat')
        .notEmpty()
        .withMessage('Latitude is not valid'),
    check('lng')
        .notEmpty()
        .withMessage('Longitude is not valid'),
    check('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 50 })
        .withMessage('Name must be less than 50 characters'),
    check('description')
        .notEmpty()
        .withMessage('Description is required'),
    check('price')
        .notEmpty()
        .withMessage('Price per day is required'),
    handleValidationErrors
  ];
//   const validateSpot = [
//     check('address')
//       .notEmpty()
//       .withMessage('Street address is required'),
//     check('city')
//       .notEmpty()
//       .withMessage('City is required'),
//     check('state')
//       .notEmpty()
//       .withMessage('State is required'),
//     check('country')
//       .notEmpty()
//       .withMessage('Country is required'),
//     check('lat')
//       .isFloat({ min: -90, max: 90 })
//       .withMessage('Latitude must be within -90 and 90'),
//     check('lng')
//       .isFloat({ min: -180, max: 180 })
//       .withMessage('Longitude must be within -180 and 180'),
//     check('name')
//       .notEmpty()
//       .withMessage('Name is required')
//       .isLength({ max: 50 })
//       .withMessage('Name must be less than 50 characters'),
//     check('description')
//       .notEmpty()
//       .withMessage('Description is required'),
//     check('price')
//       .isFloat({ gt: 0 })
//       .withMessage('Price per day must be a positive number'),
//     handleValidationErrors
//   ];

router.post('/', requireAuth, validateSpot, async (req, res) => {
    try {
        const newSpot = await Spot.create({
          ownerId: req.user.id,
          ...req.body
        });
        res.status(201).json(newSpot);
    } catch (error) {
        return res.status(400).json({
          message: 'Bad request',
          errors: error.message,
        });
        }
    }
);
// Ziwen ^^^ -------------------------------------------------------------------------


// Add an Image to a Spot based on the Spot's id---------------------------------------
router.post('/:spotId/images', requireAuth, async (req, res) => {
    const userId = req.user.id
    const spot = await Spot.findOne({
        where:{
            id: req.params.spotId
        }
    })
    // check existence
    if(!spot){
        return res.status(404).json( {"message": "Spot couldn't be found"} )
    };
    const spotOwnerId = spot.ownerId
    if(userId !== spotOwnerId){
        return res.status(403).json({ "message": "Forbidden" })
    }
    //
    
    const newSpotImage = await SpotImage.create({
        spotId:req.params.spotId,
        ...req.body
    })

    const {id , url, preview} = newSpotImage
    res.status(201).json({
        id,
        url,
        preview
    })
})
// Ziwen ^^^ ----------------------------------------------------------------------

// Edit a Spot----------------------------------------------------------------------
router.put('/:spotId', requireAuth, validateSpot, async (req, res) => {
    //! authorization could refactor
    // try {
    const userId = req.user.id
    const spot = await Spot.findOne({
        where:{
            id: req.params.spotId
        }
    })
    if(!spot){
        return res.status(404).json( {"message": "Spot couldn't be found"} )
    };
    const spotOwnerId = spot.ownerId
    if(userId !== spotOwnerId){
        return res.status(403).json({ "message": "Forbidden" })
    }
    //!
    const { address, city, state, country, lat, lng, name, description, price } = req.body;
    spot.address = address;
    spot.city = city;
    spot.state = state;
    spot.country = country;
    spot.lat = 'lat';
    spot.lng = 'lng';
    spot.name = name;
    spot.description = description;
    spot.price = price;
    await spot.save();

    res.status(200).json(spot)
    // } catch(error){
    //     return res.status(400).json({
    //         message: "Bad Request",
    //         errors: error.message
    //     })
    // }
})
// Ziwen ^^^ ----------------------------------------------------------------------


router.delete('/:spotId', requireAuth, async (req, res) => {
    //! authorization could refactor
    const userId = req.user.id
    const spot = await Spot.findOne({
        where:{
            id: req.params.spotId
        }
    })
    if(!spot){
        return res.status(404).json( {"message": "Spot couldn't be found"} )
    };
    const spotOwnerId = spot.ownerId
    if(userId !== spotOwnerId){
        return res.status(403).json({ "message": "Forbidden" })
    }
    //!
    const deleteSpot = await Spot.findByPk(req.params.spotId);
    await deleteSpot.destroy();
    res.json({
      message: 'Successfully deleted',
    })

})

// Get all Reviews by a Spot's id----------------------------------------------
router.get('/:spotId/reviews', async (req,res) =>{
    const spot = await Spot.findOne({
        where:{
            id: req.params.spotId
        }
    })
    if(!spot){
        return res.status(404).json( {"message": "Spot couldn't be found"} )
    };

    const Reviews = await Review.findAll({
        where:{
            spotId:req.params.spotId
        },
        include:[{ model:User, attributes: ['id','firstName','lastName']},
        {model:ReviewImage, attributes: ['id','url']}
]
    })
    res.json({Reviews})
})
//Ziwen ^^^------------------------------------------------------------------------

// create review based on spot Id---------------------------------------------------
const validateReview =[
    check('review')
    .notEmpty()
    .withMessage('Review text is required'),
  check('stars')
    .isInt({ min: 1, max: 5 })
    .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors
]
router.post('/:spotId/reviews', requireAuth, validateReview, async(req,res) =>{
    const spot = await Spot.findOne({
        where:{
            id: req.params.spotId
        }
    })
    if(!spot){
        return res.status(404).json( {"message": "Spot couldn't be found"} )
    };
    
    const Reviews = await Review.findAll({
        where:{
            spotId:req.params.spotId
        },
        attributes:['userId']
    })
    for (const review of Reviews) {
        if ( req.user.id == review.userId){
            return res.status(500).json({
                message: "User already has a review for this spot"
            })
        }
    }

    const newReview = await Review.create({
        userId:req.user.id,
        spotId:req.params.spotId,
        ...req.body
    })
    res.status(201).json(newReview)

})
//Ziwen ^^^------------------------------------------------------------------------

//Get all Bookings for a Spot based on the Spot's id-------------------------------
router.get('/:spotId/bookings', requireAuth , async (req,res)=>{
    //!refactor
    const spot = await Spot.findOne({
        where:{
            id: req.params.spotId
        }
    })
    if(!spot){
        return res.status(404).json( {"message": "Spot couldn't be found"} )
    };
    //!
    //! refactor check if it's owner
    const userId = req.user.id
    // console.log('userID',userId)
    const targetSpot = await Spot.findOne({
        where:{id : req.params.spotId}
    })
    const spotOwnerId = targetSpot.toJSON().ownerId
    // console.log('spot Owner ID',spotOwnerId)
    //!
    if(userId == spotOwnerId){
        const Bookings = await Booking.findAll({
            where:{userId:userId},
            include:[{model:User, attributes:['id','firstName','lastName']}],
        })
        res.json({Bookings})
    }
    if(userId !== spotOwnerId){
        const Bookings = await Booking.findAll({
            where:{userId:userId},
            attributes:["spotId","startDate","endDate"]
        })
        res.json({Bookings})
    }
})
//---------------------------------------------------------------------------------------

//Create a Booking from a Spot based on the Spot's id-----------------------------------
router.post('/:spotId/bookings' , requireAuth, async (req,res) =>{
    //!refactor
    const spot = await Spot.findOne({
        where:{
            id: req.params.spotId
        }
    })
    if(!spot){
        return res.status(404).json( {"message": "Spot couldn't be found"} )
    };
    //!
    const userId = req.user.id
    // console.log('userID',userId)
    const targetSpot = await Spot.findOne({
        where:{id : req.params.spotId}
    })
    const spotOwnerId = targetSpot.toJSON().ownerId
    // console.log('spot Owner ID',spotOwnerId)
    if(userId == spotOwnerId){
        return res.status(403).json({ "message": "Spot must NOT belong to the current user" })
    }
    const newBooking = await Booking.create({})


})
//---------------------------------------------------------------------------------------





module.exports = router;