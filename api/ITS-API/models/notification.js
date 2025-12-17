"use strict";
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      notification_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      recipient_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      // issue_id: {
      //   type: DataTypes.UUID,
      //   allowNull: true,
      // },
      reference_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reference_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      email_sent_at: {
        type: DataTypes.DATE,
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
      tableName: "notifications",
      timestamps: false,
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: "recipient_id",
      as: "recipient",
    });
    Notification.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "actor",
    });
    // Notification.belongsTo(models.Issue, {
    //   foreignKey: "issue_id",
    //   as: "issue",
    // });
  };

  return Notification;
};
