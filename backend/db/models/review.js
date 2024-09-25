'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      // define association here
      Review.hasMany(models.ReviewImage, { foreignKey: "reviewId", onDelete: 'CASCADE'});
      Review.belongsTo(models.User, { foreignKey: "userId", onDelete: 'CASCADE' });
      Review.belongsTo(models.Spot, { foreignKey: "spotId", onDelete: 'CASCADE' });
    }
  }

  Review.init({
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
    review: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    }
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};