"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    static associate(models) {
      Project.belongsTo(models.Institute, {
        foreignKey: "institute_id",
        as: "institute",
      });


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
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
      },
      institute_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },


      status: {
        type: DataTypes.ENUM("planned", "in_progress", "completed", "on_hold"),
        defaultValue: "planned",
      },
    },
    {
      sequelize,
      modelName: "Project",
      tableName: "projects",
      underscored: true,
    }
  );

  return Project;
};
