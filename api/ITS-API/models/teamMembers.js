"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TeamMembers extends Model {
    static associate(models) {
      TeamMembers.belongsTo(models.Team, {
        foreignKey: "team_id",
        as: "team",
      });
      TeamMembers.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "member",
      });
    }
  }

  TeamMembers.init(
    {
      team_member_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      team_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role_in_team: DataTypes.STRING, // e.g., Head, Member, Tester
      assigned_at: DataTypes.DATE,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "TeamMembers",
      tableName: "team_members",
      timestamps: false,
    }
  );

  return TeamMembers;
};
