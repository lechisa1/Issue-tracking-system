"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Branch extends Model {
    static associate(models) {
      // Branch belongs to Region
      this.belongsTo(models.Region, {
        foreignKey: "region_id",
        as: "region",
      });
      // Branch belongs to City
      this.belongsTo(models.City, {
        foreignKey: "city_id",
        as: "city",
      });
      // Branch belongs to Sub_city
      this.belongsTo(models.Sub_city, {
        foreignKey: "sub_city_id",
        as: "sub_city",
      });
      // Branch belongs to Woreda
      this.belongsTo(models.Woreda, {
        foreignKey: "woreda_id",
        as: "woreda",
      });
      // Branch has many Projects
      this.hasMany(models.Project, {
        foreignKey: "branch_id",
        as: "projects",
      });
    }
  }

  Branch.init(
    {
      branch_id: {
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
      city_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "city",
          key: "city_id",
        },
      },
      sub_city_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "sub_city",
          key: "sub_city_id",
        },
      },
      woreda_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "woreda",
          key: "woreda_id",
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Branch",
      tableName: "branch",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Branch;
};
