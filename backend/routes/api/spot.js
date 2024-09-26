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

// router.get('/',  async (req, res) => {
//     // Extract query parameters and apply defaults
//     let { page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;
//     // Convert pagination values to integers
//     if(!page){page = 1};
//     if(!size){size = 20}

//     minLat = minLat ? parseFloat(minLat) : undefined;
//     maxLat = maxLat ? parseFloat(maxLat) : undefined;
//     minLng = minLng ? parseFloat(minLng) : undefined;
//     maxLng = maxLng ? parseFloat(maxLng) : undefined;
//     minPrice = minPrice ? parseFloat(minPrice) : undefined;
//     maxPrice = maxPrice ? parseFloat(maxPrice) : undefined;

//     // Error handling object for validation errors
//     const validationErrors = {};
    
//     // Validate pagination values
//     if (isNaN(page)|| page < 1) {
//         validationErrors.page = 'Page must be greater than or equal to 1';
//     }
//     if (isNaN(size) || size < 1 || size > 20) {
//         validationErrors.size = 'Size must be between 1 and 20';
//     }

//     // Validate latitudes and longitudes
//     if (minLat && (minLat < -90 || minLat > 90)) {
//         validationErrors.minLat = 'Minimum latitude is invalid';
//     }
//     if (maxLat && (maxLat < -90 || maxLat > 90)) {
//         validationErrors.maxLat = 'Maximum latitude is invalid';
//     }
//     console.log('min',minLng,'isnan',isNaN(minLng))
//     console.log('max',maxLng,'isnan',isNaN(maxLng))

//     if ( minLng && (minLng < -180 || minLng > 180)) {
//         validationErrors.minLng = 'Minimum longitude is invalid';
//     }
//     if (maxLng && (maxLng < -180 || maxLng > 180)) {
//         validationErrors.maxLng = 'Maximum longitude is invalid';
//     }

//     // Validate prices
//     if (minPrice !== undefined && minPrice < 0) {
//         validationErrors.minPrice = 'Minimum price must be greater than or equal to 0';
//     }
//     if (maxPrice !== undefined && maxPrice < 0) {
//         validationErrors.maxPrice = 'Maximum price must be greater than or equal to 0';
//     }

//     // If there are validation errors, return a 400 Bad Request
//     if (Object.keys(validationErrors).length > 0) {
//         console.log(Object.keys(validationErrors))
//         return res.status(400).json({
//             message: 'Bad Request',
//             errors: validationErrors
//         });
//     }

//     // Validate pagination values
//     // if (page < 1) page = 1;
//     // if (size < 1 || size > 20) size = 20;

//     // Build where clause based on query parameters
//     const where = {};
//     if (minLat) where.lat = { [Op.gte]: parseFloat(minLat) };
//     if (maxLat) where.lat = { ...where.lat, [Op.lte]: parseFloat(maxLat) };
//     if (minLng) where.lng = { [Op.gte]: parseFloat(minLng) };
//     if (maxLng) where.lng = { ...where.lng, [Op.lte]: parseFloat(maxLng) };
//     if (minPrice) where.price = { [Op.gte]: parseFloat(minPrice) };
//     if (maxPrice) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };

//     const options = {
//         where,
//         ...addAvgRatingAndPreviewImage
//     }
//     if(page && size && !isNaN(page) && !isNaN(size)){
//         page = parseInt(page);
//         size = parseInt(size);
//         options.limit = size,
//         options.offset = (page - 1) * size
//     }

//     try {
//         // Fetch filtered spots with pagination and ratings/images
//         const spots = await Spot.findAll(options);

//         // Return the spots and pagination info
//         res.status(200).json({
//             Spots: spots,
//             page,
//             size
//         });
//     } catch (error) {
//         res.status(400).json({
//             message: 'Bad Request',
//             errors: error.message
//         });
//     }
// });

  const validateQuery = [
    check('page')
    .optional()
    .isInt({min:1}).withMessage('Page must be greater than or equal to 1'),
    check('size')
    .optional()
    .isInt({min:1}).withMessage('Size must be greater than or equal to 1'),

    check('minLat')
    .optional()
      .isFloat()
      .withMessage('Minimum latitude is invalid'),
      check('maxLat')
      .optional()
      .isFloat()
      .withMessage('Maximum latitude is invalid'),
    check('minLng')
    .optional()
      .isFloat()
      .withMessage('Minimum longitude is invalid'),
      check('maxLng')
      .optional()
      .isFloat()
      .withMessage('Maximum longitude is invalid'),

    
    check('minPrice')
    .optional()
      .isFloat({ gte: 0 })
      .withMessage('Minimum price must be greater than or equal to 0'),
      check('maxPrice')
      .optional()
      .isFloat({ gte: 0 })
      .withMessage('Maximum price must be greater than or equal to 0'),
    handleValidationErrors
  ];

// get all spots--------------------------------------------------------------
router.get('/',validateQuery, async (req, res) => {
    let { page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;
    if(!page){page = 1};
    if(!size){size = 20}
    minPrice = minPrice ? parseFloat(minPrice) : undefined;
    maxPrice = maxPrice ? parseFloat(maxPrice) : undefined;
    const where = {};
    if (minLat) where.lat = { [Op.gte]: parseFloat(minLat) };
    if (maxLat) where.lat = { ...where.lat, [Op.lte]: parseFloat(maxLat) };
    if (minLng) where.lng = { [Op.gte]: parseFloat(minLng) };
    if (maxLng) where.lng = { ...where.lng, [Op.lte]: parseFloat(maxLng) };
    if (minPrice) where.price = { [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    const options = {
        where,
        ...addAvgRatingAndPreviewImage
    }
    if(page && size && !isNaN(page) && !isNaN(size)){
        page = parseInt(page);
        size = parseInt(size);
        options.limit = size,
        options.offset = (page - 1) * size
    }

    const Spots = await Spot.findAll(options);
    // console.log(Spots[0].toJSON())

    const changeToNum = Spots.map(spot => ({
        ...spot.toJSON(),
        lat: Number(spot.lat), 
        lng: Number(spot.lng),
        price: Number(spot.price)
    }));



    res.json({ 
        Spots:changeToNum,
        page,
        size
     });
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