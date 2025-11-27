'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InternalIssueEscalation extends Model {
    static associate(models) {
      // Link to the original issue
      InternalIssueEscalation.belongsTo(models.Issue, {
        foreignKey: 'issue_id',
        as: 'issue', // always return data nested as issue
      });

      // attachments
      InternalIssueEscalation.hasMany(models.InternalEscalationAttachment, {
        foreignKey: 'internal_issue_escalation_id',
        as: 'attachments',
      });

      // comments
      InternalIssueEscalation.hasMany(models.InternalEscalationComment, {
        foreignKey: 'internal_issue_escalation_id',
        as: 'comments',
      });

      // histories
      InternalIssueEscalation.hasMany(models.InternalIssueEscalationHistory, {
        foreignKey: 'internal_issue_escalation_id',
        as: 'histories',
      });

      // external CA user
      InternalIssueEscalation.belongsTo(models.User, {
        foreignKey: 'external_ca_user_id',
        as: 'externalCAUser',
      });
    }

    // Always include Issue when fetching InternalIssueEscalation
    static defaultScope() {
      return {
        include: [{
          model: sequelize.models.Issue,
          as: 'issue',
        }],
      };
    }
  }

  InternalIssueEscalation.init(
    {
      escalation_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      issue_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      external_ca_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'InternalIssueEscalation',
      tableName: 'internal_issue_escalations',
      underscored: true,
      defaultScope: { include: ['issue'] },
    }
  );

  return InternalIssueEscalation;
};
