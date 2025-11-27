'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InternalIssueEscalation extends Model {
    static associate(models) {
      InternalIssueEscalation.belongsTo(models.Issue, { foreignKey: 'issue_id', as: 'issue' });
      InternalIssueEscalation.belongsTo(models.User, { foreignKey: 'from_tier', as: 'fromUser' });
      InternalIssueEscalation.belongsTo(models.User, { foreignKey: 'to_tier', as: 'toUser' });
      InternalIssueEscalation.belongsTo(models.User, { foreignKey: 'escalated_by', as: 'escalatedBy' });
      InternalIssueEscalation.hasMany(models.InternalIssueAttachment, { foreignKey: 'escalation_id', as: 'attachments' });
    }
  }

  InternalIssueEscalation.init(
    {
      escalation_id: { 
        type: DataTypes.UUID, 
        primaryKey: true, 
        defaultValue: DataTypes.UUIDV4 
      },
      issue_id: { 
        type: DataTypes.UUID, 
        allowNull: false,
        validate: {
          notNull: { msg: 'Issue ID is required' },
          isUUID: { args: 4, msg: 'Issue ID must be a valid UUID' }
        }
      },
      from_tier: { 
        type: DataTypes.UUID, 
        allowNull: false,
        validate: {
          notNull: { msg: 'From tier is required' },
          isUUID: { args: 4, msg: 'From tier must be a valid UUID' }
        }
      },
      to_tier: { 
        type: DataTypes.UUID, 
        allowNull: true,
        validate: {
          isUUID: { args: 4, msg: 'To tier must be a valid UUID' }
        }
      },
      escalated_by: { 
        type: DataTypes.UUID, 
        allowNull: false,
        validate: {
          notNull: { msg: 'Escalated by is required' },
          isUUID: { args: 4, msg: 'Escalated by must be a valid UUID' }
        }
      },
      action_type: { 
        type: DataTypes.ENUM('escalate', 'resolve', 'return'), 
        allowNull: false,
        validate: {
          notNull: { msg: 'Action type is required' },
          isIn: {
            args: [['escalate', 'resolve', 'return']],
            msg: 'Action type must be escalate, resolve, or return'
          }
        }
      },
      attachment_status: {
        type: DataTypes.ENUM('pending', 'resolved', 'returned', 'escalated'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending', 'resolved', 'returned', 'escalated']],
            msg: 'Attachment status must be pending, resolved, returned, or escalated'
          }
        }
      },
      action_note: { 
        type: DataTypes.TEXT, 
        allowNull: true 
      },
   
    },
    {
      sequelize,
      modelName: 'InternalIssueEscalation',
      tableName: 'internal_issue_escalations',
      underscored: true,
      validate: {
        toTierRequiredIfEscalate() {
          if (this.action_type === 'escalate' && !this.to_tier) {
            throw new Error('To tier is required when action type is escalate');
          }
        }
      }
    }
  );

  return InternalIssueEscalation;
};
