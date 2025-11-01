"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Team extends Model {
    static associate(models) {
      // Team ↔ User (many-to-many)
      Team.belongsToMany(models.User, {
        through: models.TeamMembers,
        foreignKey: "team_id",
        otherKey: "user_id",
        as: "members",
      });



    }
  }

  Team.init(
    {
      team_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      team_type: {
        type: DataTypes.ENUM("developer", "qa"),
        allowNull: false,
      },
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Team",
      tableName: "teams",
      underscored: true,
    }
  );

  return Team;
};
