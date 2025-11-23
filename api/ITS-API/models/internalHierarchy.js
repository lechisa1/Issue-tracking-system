"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InternalHierarchy extends Model {
    static associate(models) {
      // Parent -> Child
      InternalHierarchy.belongsTo(models.InternalHierarchy, {
        foreignKey: "parent_id",
        as: "parent",
      });

      InternalHierarchy.hasMany(models.InternalHierarchy, {
        foreignKey: "parent_id",
        as: "children",
      });

      // Relation to Users
      InternalHierarchy.hasMany(models.User, {
        foreignKey: "hierarchy_node_id", // match users table
        as: "users",
      });
    }
  }

  InternalHierarchy.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: true, // QAL, QAM, DEV, etc.
        unique: true,
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "InternalHierarchy",
      tableName: "internal_hierarchies",
      timestamps: false,
      underscored: true,
    }
  );

  return InternalHierarchy;
};
