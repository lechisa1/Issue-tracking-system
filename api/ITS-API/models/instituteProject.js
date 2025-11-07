"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InstituteProject extends Model {
    static associate(models) {
      // InstituteProject ↔ Institute
      InstituteProject.belongsTo(models.Institute, {
        foreignKey: "institute_id",
        as: "institute",
      });

      // InstituteProject ↔ Project
      InstituteProject.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      // InstituteProject ↔ Issue
      InstituteProject.hasMany(models.Issue, {
        foreignKey: "institute_project_id",
        as: "issues",
      });
    }
  }

  InstituteProject.init(
    {
      institue_project_id: {
        // (matches your schema)
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      institute_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
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
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "InstituteProject",
      tableName: "institute_projects",
      timestamps: true,
      paranoid: true, // enables soft delete using deleted_at
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return InstituteProject;
};
