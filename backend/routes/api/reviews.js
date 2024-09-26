const express = require('express');
const { Spot, User, Booking, Review, ReviewImage, SpotImage, sequelize } = require ('../../db/models')
const router = express.Router();
const { Op, ExclusionConstraintError } = require('sequelize');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const dialect = sequelize.getDialect()
const schema = process.env.schema;
const mode = dialect === 'postgres' && schema ? `"${schema}".` : '';

//Get all Reviews of the Current User--------------------------------------------------------
router.get('/current', requireAuth, async (req, res) => {
    const Reviews = await Review.findAll({
        where: {
            userId: req.user.id
        },
        include: [
            { model: User, attributes: ['id', 'firstName', 'lastName']
            },
            {   model: Spot,
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COALESCE((
                                    SELECT "url"
                                    FROM ${mode}"SpotImages"
                                    WHERE ${mode}"SpotImages"."spotId" = "Spot"."id" AND ${mode}"SpotImages"."preview" = true
                                    LIMIT 1
                                ), 'no preview image')
                            )`),
                            'previewImage'
                        ]
                    ],
                    exclude: ['createdAt', 'description', 'updatedAt']
                }
            },
            {
                model: ReviewImage,
                attributes: ['id', 'url']
            }
        ]
    });
    res.json({ Reviews });
});

//------------------------------------------------------------------------------------

//Add an Image to a Review based on the Review's id------------------------------------
router.post('/:reviewId/images', requireAuth, async (req,res) =>{
    //! authorization could refactor
    const userId = req.user.id
    const review = await Review.findOne({
        where:{
            id: req.params.reviewId
        }
    })
    if(!review){
        return res.status(404).json( {"message": "Review couldn't be found"} )
    };
    const reviewOwnerId = review.userId
    if(userId !== reviewOwnerId){
        return res.status(403).json({ "message": "Forbidden" })
    }
    //!

    const checkImgCount = await ReviewImage.findAndCountAll({
        where:{reviewId:req.params.reviewId}
    })
    if(checkImgCount.count >= 10){
        return res.status(403).json({
            message: "Maximum number of images for this resource was reached"
        })
    }

    const newReviewImage = await ReviewImage.create({
        reviewId: req.params.reviewId,
        ...req.body
    })
    
    const{ id, reviewId, url , updatedAt, createdAt} = newReviewImage

    res.status(201).json({id,url})

})
//---------------------------------------------------------------------------

//Edit a Review-------------------------------------------------------------
const validateReview =[
    check('review')
    .notEmpty()
    .withMessage('Review text is required'),
  check('stars')
    .isInt({ min: 1, max: 5 })
    .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors
]

router.put('/:reviewId', requireAuth, validateReview, async (req,res) =>{
    //! authorization could refactor
    const userId = req.user.id
    const targetReview = await Review.findOne({
        where:{
            id: req.params.reviewId
        }
    })
    if(!targetReview){
        return res.status(404).json( {"message": "Review couldn't be found"} )
    };
    const reviewOwnerId = targetReview.userId
    if(userId !== reviewOwnerId){
        return res.status(403).json({ "message": "Forbidden" })
    }
    //!

    const{review,stars} = req.body
    targetReview.review = review
    targetReview.stars = stars
    await targetReview.save()
    res.status(200).json(targetReview)
})
//----------------------------------------------------------------------------

//Delete a Review------------------------------------------------------------
router.delete('/:reviewId', requireAuth,  async (req,res) =>{
    //! authorization could refactor
    const userId = req.user.id
    const targetReview = await Review.findOne({
        where:{
            id: req.params.reviewId
        }
    })
    if(!targetReview){
        return res.status(404).json( {"message": "Review couldn't be found"} )
    };
    const reviewOwnerId = targetReview.userId
    if(userId !== reviewOwnerId){
        return res.status(403).json({ "message": "Forbidden" })
    }
    //!
    const deleteReview = await Review.findByPk(req.params.reviewId);
    await deleteReview.destroy();
    res.json({
      message: 'Successfully deleted',
    })

})
//----------------------------------------------------------------------------













module.exports = router;