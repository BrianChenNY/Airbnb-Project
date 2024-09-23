'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // define association here
      Booking.belongsTo(models.User, { foreignKey: "userId" });
      Booking.belongsTo(models.Spot, { foreignKey: "spotId" });
    }
  }
  Booking.init({
    spotId:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate:{
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};