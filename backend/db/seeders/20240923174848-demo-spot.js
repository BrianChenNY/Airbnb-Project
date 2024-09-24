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
        price: 100,
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
        price: 200,
      },
      {
        ownerId: 3,
        address: '333 test street',
        city: 'Duluth',
        state: 'GA',
        country: 'United States',
        lat: 50,
        lng: 100,
        name: 'test name',
        description: 'test description',
        price: 300,
      },
      {
        ownerId: 4,
        address: '444 test street',
        city: 'Duluth',
        state: 'GA',
        country: 'United States',
        lat: 50,
        lng: 100,
        name: 'test name',
        description: 'test description',
        price: 400,
      },
      {
        ownerId: 5,
        address: '555 test street',
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
        ownerId: 1,
        address: '666 test street',
        city: 'Duluth',
        state: 'GA',
        country: 'United States',
        lat: 50,
        lng: 100,
        name: 'test name',
        description: 'test description',
        price: 300,
      }
    ], { validate: true })
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      ownerId: { [Op.in]: [1,2,3,4,5] }
    }, {});
  }
};
