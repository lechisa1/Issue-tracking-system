'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('internal_escalation_comments', {
      comment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      commented_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      comment_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('internal_escalation_comments');
  }
};
