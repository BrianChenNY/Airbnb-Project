const express = require('express');
const { Spot, User, Booking, Review, ReviewImage, SpotImage, Sequelize } = require ('../../db/models')
const router = express.Router();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

//Delete a Review Image--------------------------------------------------------------------------
router.delete('/:imageId', requireAuth, async (req,res) =>{
    const imageId = req.params.imageId;
    const userId = req.user.id;
    const targetReviewImage = await ReviewImage.findOne({
        where:{id:imageId}
    })

    if(!targetReviewImage){
        return res.status(404).json( { "message": "Review Image couldn't be found"} )
    };

    const review = await Review.findOne({
        where:{id:targetReviewImage.reviewId}
    })
    const reviewOwnerId = review.userId
    if(userId !== reviewOwnerId){
        return res.status(403).json({ "message": "Forbidden" })
    }

    await targetReviewImage.destroy()
    res.status(200).json({
        "message": "Successfully deleted"
    })

})











//-----------------------------------------------------------------------------------------------

module.exports = router;