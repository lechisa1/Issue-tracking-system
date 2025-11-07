"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert("sub_roles", [
      // Developer sub-roles
      {
        sub_role_id: uuidv4(),
        name: "Backend Developer",
        description: "Server-side development and API implementation",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sub_role_id: uuidv4(),
        name: "Frontend Developer",
        description: "Client-side development and user interface",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sub_role_id: uuidv4(),
        name: "Mobile Developer",
        description: "Mobile application development",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sub_role_id: uuidv4(),
        name: "Full Stack Developer",
        description: "Both frontend and backend development",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // Quality Assurance sub-roles
      {
        sub_role_id: uuidv4(),
        name: "QA Director",
        description: "Head of quality assurance department",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sub_role_id: uuidv4(),
        name: "QA Lead",
        description: "QA team lead and coordinator",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sub_role_id: uuidv4(),
        name: "QA Engineer",
        description: "Quality assurance testing and validation",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ICT Support sub-roles
      {
        sub_role_id: uuidv4(),
        name: "ICT Support L1",
        description: "Level 1 technical support",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sub_role_id: uuidv4(),
        name: "ICT Support L2",
        description: "Level 2 technical support",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sub_role_id: uuidv4(),
        name: "ICT Support L3",
        description: "Level 3 advanced technical support",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // Administration sub-roles
      {
        sub_role_id: uuidv4(),
        name: "System Administrator",
        description: "System configuration and maintenance",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sub_role_id: uuidv4(),
        name: "User Administrator",
        description: "User management and access control",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("sub_roles", null, {});
  },
};