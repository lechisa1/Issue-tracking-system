// ...existing code...
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Zone extends Model {
    static associate(models) {
      // Zone belongs to Region
      this.belongsTo(models.Region, {
        foreignKey: "region_id",
        as: "region",
      });

      // Zone has many Woredas
      this.hasMany(models.Woreda, {
        foreignKey: "zone_id",
        as: "woredas",
      });

      // Zone has many Branches (if Branch model exists)
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
      region_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "region",
          key: "region_id",
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
