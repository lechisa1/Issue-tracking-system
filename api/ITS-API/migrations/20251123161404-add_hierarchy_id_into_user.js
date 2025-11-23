'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'hierarchy_id', {
      type: Sequelize.UUID,
      allowNull: true, // only required for internal users
      references: {
        model: 'internal_hierarchies', // table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'hierarchy_id');
  }
};
