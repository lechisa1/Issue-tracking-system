'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InternalEscalationAttachment extends Model {
    static associate(models) {
      InternalEscalationAttachment.belongsTo(models.InternalIssueEscalation, {
        foreignKey: 'internal_issue_escalation_id',
        as: 'escalation'
      });

      InternalEscalationAttachment.belongsTo(models.User, {
        foreignKey: 'uploaded_by',
        as: 'uploadedBy'
      });
    }
  }

  InternalEscalationAttachment.init({
      attachment_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      internal_issue_escalation_id: DataTypes.UUID,
      uploaded_by: DataTypes.UUID,
      file_name: DataTypes.STRING,
      file_path: DataTypes.STRING,
      mime_type: DataTypes.STRING,
      file_size: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'InternalEscalationAttachment',
    tableName: 'internal_escalation_attachments',
    underscored: true
  });

  return InternalEscalationAttachment;
};
