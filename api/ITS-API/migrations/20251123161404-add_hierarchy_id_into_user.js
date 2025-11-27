'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'internal_hierarchy_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'internal_hierarchies',
        key: 'internal_hierarchy_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'internal_hierarchy_id');
  }
};
