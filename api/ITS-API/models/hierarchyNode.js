"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HierarchyNode extends Model {
    static associate(models) {
      // HierarchyNode ↔ Hierarchy
      HierarchyNode.belongsTo(models.Hierarchy, {
        foreignKey: "hierarchy_id",
        as: "hierarchy",
      });

      // Self-referencing relationship (Parent → Children)
      HierarchyNode.belongsTo(models.HierarchyNode, {
        foreignKey: "parent_id",
        as: "parent",
      });

      HierarchyNode.hasMany(models.HierarchyNode, {
        foreignKey: "parent_id",
        as: "children",
      });
    }
  }

  HierarchyNode.init(
    {
      hierarchy_node_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      hierarchy_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        unique: true,
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
      modelName: "HierarchyNode",
      tableName: "hierarchy_node",
      timestamps: true,
      paranoid: true, // enables soft delete using deleted_at
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return HierarchyNode;
};
