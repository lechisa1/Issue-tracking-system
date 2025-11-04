"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Zone extends Model {
    static associate(models) {
      // Zone belongs to Sub_city
      this.belongsTo(models.Sub_city, {
        foreignKey: "sub_city_id",
        as: "sub_city",
      });
      // Zone has many Branches
      this.hasMany(models.Branch, {
        foreignKey: "zone_id",
        as: "branches",
      });
    }
  }

  Zone.init(
    {
      zone_id: {
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
      modelName: "Zone",
      tableName: "zone",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Zone;
};
