"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class IssueAttachment extends Model {
    static associate(models) {
      // IssueAttachment ↔ Issue
      IssueAttachment.belongsTo(models.Issue, {
        foreignKey: "issue_id",
        as: "issue",
      });

      // IssueAttachment ↔ User (uploaded by)
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
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      issue_id: DataTypes.UUID,
      file_name: DataTypes.STRING(255),
      file_path: DataTypes.STRING(500),
      uploaded_by: DataTypes.UUID,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "IssueAttachment",
      tableName: "issue_attachments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return IssueAttachment;
};
