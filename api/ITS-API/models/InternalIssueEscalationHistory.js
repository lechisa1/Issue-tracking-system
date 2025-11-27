'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InternalIssueEscalationHistory extends Model {
    static associate(models) {
      InternalIssueEscalationHistory.belongsTo(models.InternalIssueEscalation, {
        foreignKey: 'internal_issue_escalation_id',
        as: 'escalation'
      });

      InternalIssueEscalationHistory.belongsTo(models.User, {
        foreignKey: 'from_tier',
        as: 'fromTier'
      });

      InternalIssueEscalationHistory.belongsTo(models.User, {
        foreignKey: 'to_tier',
        as: 'toTier'
      });
    }
  }

  InternalIssueEscalationHistory.init({
      history_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      internal_issue_escalation_id: DataTypes.UUID,
      from_tier: DataTypes.UUID,
      to_tier: DataTypes.UUID,
      action_type: DataTypes.ENUM('assign', 'broadcast', 'resolve', 'reject', 'fixed_return'),
      action_note: DataTypes.TEXT,
      from_action: DataTypes.STRING,
      to_action: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'InternalIssueEscalationHistory',
    tableName: 'internal_issue_escalation_histories',
    underscored: true
  });

  return InternalIssueEscalationHistory;
};
