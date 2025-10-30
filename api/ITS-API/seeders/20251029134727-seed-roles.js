"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert("roles", [
      // Internal roles
      {
        role_id: uuidv4(),
        name: "Administration",
        description: "Manages the system configuration, user management, and overall administration of the Issue Tracking System.",
        role_type: "internal",
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "Quality Assurance",
        description: "Responsible for reviewing issues, validating solutions, and ensuring quality standards are met for internal projects.",
        role_type: "internal",
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "Developer",
        description: "Handles the technical implementation and resolution of issues, including coding and troubleshooting tasks.",
        role_type: "internal",
        created_at: now,
        updated_at: now,
      },

      // External roles
      {
        role_id: uuidv4(),
        name: "ICT Supporter",
        description: "External user who provides IT support, monitors systems, and assists with issue resolution requests.",
        role_type: "external",
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "Central Manager",
        description: "External user responsible for overseeing project progress, approvals, and high-level decision making.",
        role_type: "external",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};
