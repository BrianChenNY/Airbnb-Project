'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReviewImage extends Model {
    static associate(models) {
      // define association here
      ReviewImage.belongsTo(models.Review, { foreignKey:"reviewId", onDelete: 'CASCADE'});
    }
  }

  ReviewImage.init({
    reviewId:{
      type:DataTypes.INTEGER,
      allowNull: false,
      references:{
        model:'Reviews',
        key:'id'
      },
      onDelete: 'CASCADE',
    },
    url:{
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'ReviewImage',
  });
  return ReviewImage;
};