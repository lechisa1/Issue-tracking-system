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
        level: "EAI",
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "Quality Assurance",
        description: "Responsible for reviewing issues, validating solutions, and ensuring quality standards are met for internal projects.",
        level: "EAI",
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "Developer",
        description: "Handles the technical implementation and resolution of issues, including coding and troubleshooting tasks.",
        level: "EAI",
        created_at: now,
        updated_at: now,
      },

      // External roles
      {
        role_id: uuidv4(),
        name: "ICT Supporter",
        description: "External user who provides IT support, monitors systems, and assists with issue resolution requests.",
        level: "institute",
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "Central Manager",
        description: "External user responsible for overseeing project progress, approvals, and high-level decision making.",
        level: "external",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};
