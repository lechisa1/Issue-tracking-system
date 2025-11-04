"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("woreda", {
      woreda_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      zone_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "zone",
          key: "zone_id",
        },
      },

      sub_city_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "sub_city",
          key: "sub_city_id",
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("woreda");
  },
};
