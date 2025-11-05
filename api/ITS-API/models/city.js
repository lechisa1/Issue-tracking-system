"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    static associate(models) {
      // City has many Sub_cities
      this.hasMany(models.Sub_city, {
        foreignKey: "city_id",
        as: "sub_cities",
      });
      // City has many Branches
      this.hasMany(models.Branch, {
        foreignKey: "city_id",
        as: "branches",
      });
    }
  }

  City.init(
    {
      city_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "City",
      tableName: "city",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return City;
};
