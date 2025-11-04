"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Sub_city extends Model {
    static associate(models) {
      // Sub_city belongs to Region
      this.belongsTo(models.Region, {
        foreignKey: "region_id",
        as: "region",
      });
      // Sub_city has many Zones
      this.hasMany(models.Zone, {
        foreignKey: "sub_city_id",
        as: "zones",
      });
      // Sub_city has many Branches
      this.hasMany(models.Branch, {
        foreignKey: "sub_city_id",
        as: "branches",
      });
    }
  }

  Sub_city.init(
    {
      sub_city_id: {
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
      modelName: "Sub_city",
      tableName: "sub_city",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Sub_city;
};
