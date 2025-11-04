"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Woreda extends Model {
    static associate(models) {
      // Woreda belongs to SubCity
      this.belongsTo(models.Sub_city, {
        foreignKey: "sub_city_id",
        as: "sub_city",
      });
      // Woreda has many Zones
      this.hasMany(models.Zone, {
        foreignKey: "woreda_id",
        as: "zones",
      });
      // Woreda has many Branches
      this.hasMany(models.Branch, {
        foreignKey: "woreda_id",
        as: "branches",
      });
    }
  }

  Woreda.init(
    {
      woreda_id: {
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
      sub_city_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "sub_city",
          key: "sub_city_id",
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Woreda",
      tableName: "woreda",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Woreda;
};
