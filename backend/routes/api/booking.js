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



module.exports = router;