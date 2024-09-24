const express = require('express');
const { Spot, User, Booking, Review, ReviewImage, SpotImage, Sequelize } = require ('../../db/models')
const router = express.Router();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');


//Delete a spot image

router.delete('/:imageId' , requireAuth, async(req,res) =>{
    const imageId = req.params.imageId
    const userId = req.user.id;
    const targetSpotImage = await SpotImage.findOne({
        where:{id:imageId}
    })

    if(!targetSpotImage){
        return res.status(404).json( { "message": "Spot Image couldn't be found"} )
    };

    const targetSpot = await Spot.findOne({
        where:{id:targetSpotImage.spotId}
    })
    // console.log(targetSpot)
    if(userId !== targetSpot.ownerId){
        return res.status(403).json({ "message": "Forbidden" })
    }

    await targetSpotImage.destroy()
    res.status(200).json({
        "message": "Successfully deleted"
    })
    
})







module.exports = router;