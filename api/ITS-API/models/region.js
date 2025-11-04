"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Region extends Model {
    static associate(models) {
      // Region has many Sub_cities
      this.hasMany(models.Sub_city, {
        foreignKey: "region_id",
        as: "sub_cities",
      });
      // Region has many Branches
      this.hasMany(models.Branch, {
        foreignKey: "region_id",
        as: "branches",
      });
    }
  }

  Region.init(
    {
      region_id: {
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
      modelName: "Region",
      tableName: "region",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Region;
};
