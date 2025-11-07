
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    static associate(models) {
      Project.belongsTo(models.Institute, {
        foreignKey: "institute_id",
        as: "institute",
      });

      Project.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "creator",
      });


      // Project issues
      Project.hasMany(models.Issue, {
        foreignKey: "project_id",
        as: "issues",
      });
    }
  }

  Project.init(
    {
      project_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: "active",
      },
      institute_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
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
      modelName: "Project",
      tableName: "projects",
      timestamps: false,
      underscored: true,
    }
  );

  return Project;
};