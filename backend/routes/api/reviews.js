const express = require('express');
const { Spot, User, Booking, Review, ReviewImage, SpotImage, Sequelize } = require ('../../db/models')
const router = express.Router();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

//Get all Reviews of the Current User
router.get('/current', requireAuth, async (req,res) =>{
    const Reviews = await Review.findAll({
        where:{
            userId:req.user.id
        },
        include:[{ model:User, attributes: ['id','firstName','lastName']},
                {model:Spot},
                {model:ReviewImage, attributes: ['id','url']}
        ]
    })
    res.json({Reviews})
})
//




module.exports = router;