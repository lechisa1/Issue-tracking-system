"use strict";

const { subscribe } = require("../routers/organizationRoutes");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("region", {
      region_id: {
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
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "organizations",
          key: "organization_id",
        },

      },
        city_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "city",
          key: "city_id",
        },
      },
      region_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "region",
          key: "region_id",
        },
      },
      sub_city_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "sub_city",
          key: "sub_city_id",
        },
      },
      zone_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "zone",
          key: "zone_id",
        },
      },
      woreda_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "woreda",
          key: "woreda_id",
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
   
  },
) },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("organizations");
  },
};
