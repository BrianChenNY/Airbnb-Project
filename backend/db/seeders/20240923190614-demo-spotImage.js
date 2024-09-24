'use strict';
const { SpotImage } = require('../models');
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await SpotImage.bulkCreate([
      {
        spotId:1,
        url:'testUrl',
        preview:false
      },
      {
        spotId:2,
        url:'testUrl1',
        preview:true
      },
      {
        spotId:3,
        url:'testUrl',
        preview:true
      },      {
        spotId:4,
        url:'testUrl',
        preview:true
      },      {
        spotId:5,
        url:'testUrl',
        preview:true
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'SpotImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1,2,3,4,5] }
    }, {});
  }
};
