'use strict';

const { Booking } = require('../models');
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await Booking.bulkCreate([
      {
        spotId:1,
        userId:1,
        startDate: new Date('2025-01-01'),
        endDate:new Date('2025-02-01')
      },
      {
        spotId:1,
        userId:2,
        startDate: new Date('2025-02-02'),
        endDate:new Date('2025-03-01')
      },
      {
        spotId:2,
        userId:1,
        startDate: new Date('2025-04-01'),
        endDate:new Date('2025-05-01')
      },
      {
        spotId:3,
        userId:2,
        startDate: new Date('2025-04-01'),
        endDate:new Date('2025-05-01')
      },
      {
        spotId:4,
        userId:3,
        startDate: new Date('2025-01-01'),
        endDate:new Date('2025-02-01')
      }
    ], { validate: true })
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Bookings';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1,2,3,4] }
    }, {});
  }
};
