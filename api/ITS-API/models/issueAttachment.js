"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class IssueAttachment extends Model {
    static associate(models) {
      IssueAttachment.belongsTo(models.Issue, {
        foreignKey: "issue_id",
        as: "issue",
      });

      IssueAttachment.belongsTo(models.User, {
        foreignKey: "uploaded_by",
        as: "uploader",
      });
    }
  }

  IssueAttachment.init(
    {
      attachment_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      issue_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      uploaded_by: {
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
      modelName: "IssueAttachment",
      tableName: "issue_attachments",
      timestamps: false,
      underscored: true,
    }
  );

  return IssueAttachment;
};
