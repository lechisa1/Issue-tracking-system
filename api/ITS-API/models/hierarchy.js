"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Hierarchy extends Model {
    static associate(models) {
      // A hierarchy belongs to a project
      Hierarchy.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      // A hierarchy has many nodes
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
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      project_id: { type: DataTypes.UUID, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "Hierarchy",
      tableName: "hierarchy",
      timestamps: false,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  return Hierarchy;
};
