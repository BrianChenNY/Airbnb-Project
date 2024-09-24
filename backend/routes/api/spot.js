const express = require('express');
const { Spot } = require('../../db/models');
const router = express.Router();
const { Op } = require('sequelize');
const { Review, SpotImage, Sequelize } = require ('../../db/models')

router.get('/', async (req, res) => {

    const spots = await Spot.findAll({
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
      group: ['Spot.id'] // Group by Spot ID to get the average rating per spot
    });
    res.json({ spots });
  });









module.exports = router;