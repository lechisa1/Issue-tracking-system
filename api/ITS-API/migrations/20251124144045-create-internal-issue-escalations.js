'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('internal_issue_escalations', {
      escalation_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      issue_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'issues',
          key: 'issue_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      status: {
        type: Sequelize.STRING,     
        allowNull: false,
        defaultValue: 'pending'
      },

      external_ca_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',  
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
    await queryInterface.dropTable('internal_issue_escalations');
  }
};
