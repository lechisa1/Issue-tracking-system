"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Woreda extends Model {
    static associate(models) {
      // Woreda belongs to Sub_city
      this.belongsTo(models.Sub_city, {
        foreignKey: "sub_city_id",
        as: "sub_city",
      });
      // Woreda belongs to Zone
      this.belongsTo(models.Zone, {
        foreignKey: "zone_id",
        as: "zone",
      });
      // Woreda has many Branches
      this.hasMany(models.Branch, {
        foreignKey: "branch_id",
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
      zone_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "zone",
          key: "zone_id",
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
