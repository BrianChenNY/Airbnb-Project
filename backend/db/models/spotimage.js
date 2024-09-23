'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SpotImage extends Model {
    static associate(models) {
      // define association here
    }
  }

  SpotImage.init({
    spotId:{
      type: DataTypes.INTEGER,
      allowNull:false
    },
    url:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    preview:{
      type: DataTypes.BOOLEAN
      },
  }, {
    sequelize,
    modelName: 'SpotImage',
  });
  return SpotImage;
};