"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HierarchyNode extends Model {
    static associate(models) {
      // Node belongs to hierarchy
      HierarchyNode.belongsTo(models.Hierarchy, {
        foreignKey: "hierarchy_id",
        as: "hierarchy",
      });

      // Self-referencing parent-child
      HierarchyNode.belongsTo(models.HierarchyNode, {
        foreignKey: "parent_id",
        as: "parent",
      });

      HierarchyNode.hasMany(models.HierarchyNode, {
        foreignKey: "parent_id",
        as: "children",
      });

      // Users can belong to hierarchy node
      HierarchyNode.hasMany(models.User, {
        foreignKey: "hierarchy_node_id",
        as: "users",
      });
    }
  }

  HierarchyNode.init(
    {
      hierarchy_node_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      hierarchy_id: { type: DataTypes.UUID, allowNull: false },
      parent_id: { type: DataTypes.UUID, allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "HierarchyNode",
      tableName: "hierarchy_node",
      timestamps: false,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  return HierarchyNode;
};
