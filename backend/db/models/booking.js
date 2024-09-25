'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // define association here
      Booking.belongsTo(models.User, { foreignKey: "userId", onDelete: 'CASCADE'});
      Booking.belongsTo(models.Spot, { foreignKey: "spotId", onDelete: 'CASCADE' });
    }
  }
  Booking.init({
    spotId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Spots',
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE', 
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