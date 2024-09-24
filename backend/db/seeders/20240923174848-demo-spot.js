'use strict';

const { Spot } = require('../models');


let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: '123 test street',
        city: 'Duluth',
        state: 'GA',
        country: 'United States',
        lat: 50,
        lng: 100,
        name: 'test name',
        description: 'test description',
        price: 500,
      },
      {
        ownerId: 2,
        address: '222 test street',
        city: 'Duluth',
        state: 'GA',
        country: 'United States',
        lat: 50,
        lng: 100,
        name: 'test name',
        description: 'test description',
        price: 500,
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      ownerId: { [Op.in]: [1,2] }
    }, {});
  }
};
