'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('hierarchy', 'parent_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'hierarchy',
        key: 'hierarchy_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('hierarchy', 'parent_id');
  }
};
