'use strict';

const { Review } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        spotId: 1,
        userId: 1,
        review: 'test review',
        stars: 3,
      },
      {
        spotId: 1,
        userId: 2,
        review: 'test review',
        stars: 4,
      },
      {
        spotId: 2,
        userId: 3,
        review: 'test review',
        stars: 5,
      },
      {
        spotId: 3,
        userId: 4,
        review: 'test review',
        stars: 3,
      },
      {
        spotId: 4,
        userId: 1,
        review: 'test review',
        stars: 2,
      }
    ],{ validate: true })
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Reviews';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1,2,3,4] }
    }, {});
  }
};
