'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SpotImage extends Model {
    static associate(models) {
      // define association here
      SpotImage.belongsTo(models.Spot, { foreignKey: "spotId", onDelete: 'CASCADE'});
    }
  }

  SpotImage.init({
    spotId:{
      type: DataTypes.INTEGER,
      allowNull:false,
      references:{
        model:'Spots',
        key:'id'
      },
      onDelete: 'CASCADE',
    },
    url:{
      type: DataTypes.STRING,
      allowNull: true,
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