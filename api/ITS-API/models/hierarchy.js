"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Hierarchy extends Model {
    static associate(models) {
      // Hierarchy ↔ Project
      Hierarchy.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      // Hierarchy ↔ HierarchyNode
      Hierarchy.hasMany(models.HierarchyNode, {
        foreignKey: "hierarchy_id",
        as: "nodes",
      });
    }
  }

  Hierarchy.init(
    {
      hierarchy_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      deleted_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Hierarchy",
      tableName: "hierarchy",
      timestamps: true,
      paranoid: true, // enables soft delete using deleted_at
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return Hierarchy;
};
