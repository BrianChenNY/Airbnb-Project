const express = require('express');
const { Spot, User, Booking, Review, ReviewImage, SpotImage, Sequelize } = require ('../../db/models')
const router = express.Router();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');


//Get all of the Current User's Bookings-----------------------------------------------
router.get('/current', requireAuth, async (req, res) => {
    const currentUserId = req.user.id;
    const Bookings = await Booking.findAll({
        where: { userId: currentUserId },
        include: [
            {
                model: Spot,
                attributes: { exclude: ['createdAt', 'updatedAt', 'description']},
                include: [
                    {
                        model: SpotImage,
                        attributes: ['url'],
                        where: { preview: true },
                        required: false
                    }
                ]
            }
        ]
    });

    const bookingsList = Bookings.map(booking => {
        const bookingJson = booking.toJSON();
        const spot = bookingJson.Spot;
        if (spot.SpotImages.length) {
            spot.previewImage = spot.SpotImages[0].url;
        } else {
            spot.previewImage = null;
        }
        delete spot.SpotImages;
        return bookingJson;
    });

    res.json({ Bookings: bookingsList });
});
//--------------------------------------------------------------------------------------------

//Edit a Booking-----------------------------------------------------------------------------
router.put('/:bookingId', requireAuth , async (req,res) =>{
    const userId = req.user.id
    //!refactor
    const targetBooking = await Booking.findOne({
        where:{id:req.params.bookingId}
    })

    if(!targetBooking){
        return res.status(404).json( {"message": "Booking couldn't be found"} )
    };

    const BookingUserId = targetBooking.userId
    if(userId !== BookingUserId){
        return res.status(403).json({ "message": "Forbidden" })
    }
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
    const allBookings = await Booking.findAll({
        where: { id: req.params.bookingId }
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
//!refactor
    const {startDate,endDate} = req.body
    targetBooking.startDate = startDate;
    targetBooking.endDate = endDate;
    await targetBooking.save()
    res.status(200).json(targetBooking)
})
//--------------------------------------------------------------------------------------------

//Delete a Booking--------------------------------------------------------------------------
router.delete('/:bookingId' , requireAuth , async (req,res) =>{
    const userId = req.user.id
    //!refactor
    const targetBooking = await Booking.findOne({
        where:{id:req.params.bookingId}
    })

    if(!targetBooking){
        return res.status(404).json( {"message": "Booking couldn't be found"} )
    };

    const BookingUserId = targetBooking.userId

    const bookingSpot = await Spot.findOne({
        where:{id:targetBooking.spotId}
    })

    const bookingSpotOwnerId = bookingSpot.ownerId
    if(userId == BookingUserId || bookingSpotOwnerId == BookingUserId){
        await targetBooking.destroy()
        res.status(200).json({
            "message": "Successfully deleted"
        })
    }
    else {return res.status(403).json({ "message": "Forbidden" })}
})


//--------------------------------------------------------------------------------------------

module.exports = router;