"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Sub_city extends Model {
    static associate(models) {
      // Sub_city belongs to City
      this.belongsTo(models.City, {
        foreignKey: "city_id",
        as: "city",
      });
       this.hasMany(models.Woreda, {
        foreignKey: "woreda_id",
        as: "woreda",
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
      city_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "City",
          key: "city_id",
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
