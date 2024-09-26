const express = require('express');
const { Spot, User, Booking, Review, ReviewImage, SpotImage, Sequelize, sequelize } = require ('../../db/models')
const router = express.Router();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { SELECT } = require('sequelize/lib/query-types');
const dialect = sequelize.getDialect()
const schema = process.env.SCHEMA;
const mode = dialect === 'postgres' && schema ? `"${schema}".` : '';

// Add average rating and preview image urls to current query------------------------
// const addAvgRatingAndPreviewImage = {
//     attributes: {
//         include: [
//           [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgRating'],   //add avgRating to each spot from reviews
//           [Sequelize.col('SpotImages.url'), 'previewImage']  //add previewImage's url from spotImages column
//         ]
//       },
//       include: [
//         {
//             model: Review, // Include the Review model to calculate the average
//             attributes: [] // No need to fetch all review attributes, just calculate average
//         },
//         {
//             model: SpotImage, // Include the SpotImage model to get the image URL
//             attributes: [], // No need to fetch all image attributes, just include the URL
//             where: { preview: true },  // Only get the preview image
//             required: false // Allow spots without images
//         }
//       ],
//     group: ['Spot.id', 'SpotImages.id'],
// }
// Ziwen ^^^-------------------------------------------------------------------
const addAvgRatingAndPreviewImage = {
    attributes: {
      include: [
        [
          Sequelize.literal(`(
            SELECT AVG("Reviews"."stars")
            FROM ${mode}"Reviews"
            WHERE ${mode}"Reviews"."spotId" = "Spot"."id"
          )`),
          'avgRating'
        ],
        [
          Sequelize.literal(`(
            SELECT "url"
            FROM ${mode}"SpotImages"
            WHERE ${mode}"SpotImages"."spotId" = "Spot"."id" AND ${mode}"SpotImages"."preview" = true
            LIMIT 1
          )`),
          'previewImage'
        ]
      ]
    },
  };
// const results = await sequelize.query(
//     `SELECT 
//         Spot.*, 
//         AVG(Reviews.stars) AS avgRating, 
//         SpotImages.url AS previewImage
//      FROM 
//         Spots AS Spot
//      LEFT JOIN 
//         Reviews ON Spot.id = Reviews.spotId
//      LEFT JOIN 
//         SpotImages ON Spot.id = SpotImages.spotId 
//         AND SpotImages.preview = true
//      GROUP BY 
//         Spot.id, SpotImages.id;`,
//     {
//       type: Sequelize.QueryTypes.SELECT // Specify that we are performing a SELECT query
//     }
// )
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
    const Spots = await Spot.findAll({...addAvgRatingAndPreviewImage});

    const changeToNum = Spots.map(spot => ({
        ...spot.toJSON(),
        lat: Number(spot.lat), 
        lng: Number(spot.lng),
        price: Number(spot.price)
    }));



    res.json({ Spots:changeToNum });
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
router.get('/:spotId', async (req, res) => {
    const spotId = req.params.spotId;

    try {
        const spot = await Spot.findOne({
            where: { id: spotId },
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT("Reviews"."id")
                            FROM ${mode}"Reviews"
                            WHERE ${mode}"Reviews"."spotId" = "Spot"."id"
                        )`),
                        'numReviews'
                    ],
                    [
                        Sequelize.literal(`(
                            SELECT AVG("Reviews"."stars")
                            FROM ${mode}"Reviews"
                            WHERE ${mode}"Reviews"."spotId" = "Spot"."id"
                        )`),
                        'avgStarRating'
                    ]
                ]
            },
            include: [
                {
                    model: SpotImage,
                    attributes: ['id', 'url', 'preview']
                },
                {
                    model: User,
                    as: 'Owner',
                    attributes: ['id', 'firstName', 'lastName']
                }
            ]
        });

        if (!spot) {
            return res.status(404).json({ message: "Spot couldn't be found" });
        }

        res.json(spot);
    } catch (error) {
        return res.status(404).json({ message: "Spot couldn't be found" });
    }
});
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
    spot.lat = lat;
    spot.lng = lng;
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
        spotId:Number(req.params.spotId),
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
    // console.log('spot Owner ID',spotOwnerId, 'userID',userId)
    //!
    if(userId == spotOwnerId){
        const Bookings = await Booking.findAll({
            where:{spotId:req.params.spotId},
            include:[{model:User, attributes:['id','firstName','lastName']}],
        })
        return res.json({Bookings})
    }
    if(userId !== spotOwnerId){
        const Bookings = await Booking.findAll({
            where:{spotId:req.params.spotId},
            attributes:["spotId","startDate","endDate"]
        })
        return res.json({Bookings})
    }
})
//---------------------------------------------------------------------------------------

//Create a Booking from a Spot based on the Spot's id-----------------------------------
const validateBooking = [
    check('startDate')
    .notEmpty()
    .withMessage('Review text is required'),
    handleValidationErrors
]

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

    // console.log(req.body.startDate < req.body.endDate)

    // check start date is before end
    if(req.body.startDate >= req.body.endDate){
        let errors = {}
        errors.endDate = "endDate cannot be on or before startDate"
        return res.status(400).json({
            "message":"Bad Request",
            errors
        })
    }
    //

    // look for other reservations
    // console.log(req.body.startDate)
    const allBookings = await Booking.findAll({
        where: { spotId: req.params.spotId }
    }) 
    for (const booking of allBookings) {
        const bookingJson = booking.toJSON();
        const bookingStartDate = new Date(req.body.startDate);
        const bookingEndDate = new Date(req.body.endDate);
        // console.log('start','\n',bookingStartDate, '\n', 'end', '\n', bookingEndDate)
        // console.log(bookingStartDate.toISOString() == bookingJson.startDate.toISOString())
        if(bookingStartDate.toISOString() === bookingJson.startDate.toISOString() && bookingEndDate.toISOString() === bookingJson.endDate.toISOString()){
            let errors = {}
            errors.startDate ="Start date conflicts with an existing booking";
            errors.endDate ="End date conflicts with an existing booking";
            return res.status(403).json({
                "message": "Sorry, this spot is already booked for the specified dates",
                errors
            })
        }
        else if(bookingEndDate.toISOString() === bookingJson.endDate.toISOString()){
            let errors = {}
            errors.endDate ="End date conflicts with an existing booking"
            return res.status(403).json({
                "message": "Sorry, this spot is already booked for the specified dates",
                errors
            })
        }
        else if(bookingStartDate.toISOString() === bookingJson.startDate.toISOString()){
            let errors = {}
            errors.startDate ="Start date conflicts with an existing booking"
            return res.status(403).json({
                "message": "Sorry, this spot is already booked for the specified dates",
                errors
            })
        }
    };

    // console.log(bookingDatesList)
    // res.json(allBookings)
    
    const newBooking = await Booking.create({
        spotId: req.params.spotId,
        userId: userId,
        ...req.body
    })
    res.status(201).json(newBooking)

})
//---------------------------------------------------------------------------------------





module.exports = router;