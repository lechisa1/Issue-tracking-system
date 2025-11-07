"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Hierarchy extends Model {
    static associate(models) {
      // Belongs to Project
      this.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });
      // One-to-Many relationship with HierarchyNode
      this.hasMany(models.HierarchyNode, {
        foreignKey: "hierarchy_id",
        as: "nodes",
      });
    }
  }

  Hierarchy.init(
    {
      hierarchy_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      levels: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Hierarchy",
      tableName: "hierarchy",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      paranoid: true,
    }
  );

  return Hierarchy;
};
