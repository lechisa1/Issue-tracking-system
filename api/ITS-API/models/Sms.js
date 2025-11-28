"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Sms extends Model {
    static associate(models) {
      // SMS created by a user
      Sms.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "creator",
      });
    }
  }

  Sms.init(
    {
      sms_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      sender: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ITS",
      },

      recipient: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("pending", "sent", "delivered", "failed"),
        defaultValue: "pending",
      },

      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      message_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
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
      modelName: "Sms",
      tableName: "sms_messages",
      timestamps: false,
      underscored: true,
    }
  );

  return Sms;
};
