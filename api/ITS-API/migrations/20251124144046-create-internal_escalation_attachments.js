'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('internal_escalation_attachments', {
      attachment_id: {
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
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: true
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
    await queryInterface.dropTable('internal_escalation_attachments');
  }
};
