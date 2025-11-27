'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('internal_issue_escalation_histories', {
      history_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      internal_issue_escalation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'internal_issue_escalations',
          key: 'escalation_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      from_tier: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      to_tier: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
   
      action_type: {
        type: Sequelize.ENUM('assign', 'broadcast', 'resolve','reject', 'fixed_return'),
        allowNull: false
      },
      action_note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      from_action: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pending'
      },
       to_action: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pending'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('internal_issue_escalation_histories');
  }
};
