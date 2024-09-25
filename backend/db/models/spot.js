'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    static associate(models) {
      // define association here
      Spot.belongsTo(models.User, { foreignKey: "ownerId",as: "Owner", onDelete: 'CASCADE'}); //added as "owner" for get all spots by ID
      Spot.hasMany(models.Booking, { foreignKey: "spotId", onDelete: 'CASCADE' });
      Spot.hasMany(models.Review, { foreignKey: "spotId", onDelete: 'CASCADE' });
      Spot.hasMany(models.SpotImage, { foreignKey: "spotId", onDelete: 'CASCADE' });
    }
  }
  Spot.init({
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{
        model:'Users',
        key:'id'
      }
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Street address must be unique',
      },
      validate: {
        notEmpty: { msg: 'Street address is required' },
      },
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'City is required' },
      },
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'State is required' },
      },
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Country is required' },
      },
    },
    lat: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Latitude is not valid'
        },
        min: {
          args: [-90],
          msg: 'Latitude must be within -90 and 90'
        },
        max: {
          args: [90],
          msg: 'Latitude must be within -90 and 90'
        }
      }
    },
    lng: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Longitude is not valid'
        },
        min: {
          args: [-180],
          msg: 'Longitude must be within -180 and 180'
        },
        max: {
          args: [180],
          msg: 'Longitude must be within -180 and 180'
        }
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Name must be less than 50 characters',
        },
        notEmpty: { msg: 'Name is required' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Description is required' },
      },
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Price per day is required' },
        min: {
          args: [0],
          msg: 'Price per day must be a positive number',
        },
      },
    }
  }, {
    sequelize,
    modelName: 'Spot',
  });
  return Spot;
};