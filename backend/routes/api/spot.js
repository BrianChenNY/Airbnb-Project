const express = require('express');
const { Spot, User, Booking, Review, ReviewImage, SpotImage, Sequelize } = require ('../../db/models')
const router = express.Router();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

// Add average rating and preview image urls to current query------------------------------------
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
// Ziwen ^^^------------------------------------------------------------------------


// Authentication Test---------------------------------------------------------
let authenticationTest = function(req){
    let token = req.cookies.token;
    if (!token) {
        // Handle missing token
        return res.status(401).json({ message: 'Authentication required' });
    }
    let secret = process.env.JWT_SECRET
    // let payload = jwt.decode(token)
    // console.log(payload)
    let verifiedPayload = jwt.verify(token, secret)
}
// Ziwen ^^^------------------------------------------------------------------

// get all spots--------------------------------------------------------------
router.get('/', async (req, res) => {
    const spots = await Spot.findAll({...addAvgRatingAndPreviewImage});
    res.json({ spots });
  });

// Ziwen ^^^----------------------------------------------------------------------

// Get all Spots owned by the Current User-----------------------------------------------
router.get('/current', async (req,res) =>{
    try {
        authenticationTest(req)
        // console.log('Verified payload:',verifiedPayload)
        const userId = req.user.id
        const Spots = await Spot.findAll({
            where:{ownerId:userId},
            ...addAvgRatingAndPreviewImage
        })
        res.json({
            Spots
        })
      } 
      catch (error) {
        return res.status(401).json({ message: 'Authentication required' });
      }
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



module.exports = router;