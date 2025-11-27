'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InternalEscalationComment extends Model {
    static associate(models) {
      InternalEscalationComment.belongsTo(models.InternalIssueEscalation, {
        foreignKey: 'internal_issue_escalation_id',
        as: 'escalation'
      });

      InternalEscalationComment.belongsTo(models.User, {
        foreignKey: 'commented_by',
        as: 'commentedBy'
      });
    }
  }

  InternalEscalationComment.init({
      comment_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      internal_issue_escalation_id: DataTypes.UUID,
      commented_by: DataTypes.UUID,
      comment_text: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'InternalEscalationComment',
    tableName: 'internal_escalation_comments',
    underscored: true
  });

  return InternalEscalationComment;
};
