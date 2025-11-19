"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert("roles", [
      {
        role_id: uuidv4(),
        name: "Administration",
        description: "Manages the system configuration, user management, and overall administration of the Issue Tracking System.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "Quality Assurance",
        description: "Responsible for reviewing issues, validating solutions, and ensuring quality standards are met for internal projects.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "Front-End Developer",
        description: "Handles the technical implementation and resolution of issues, including coding and troubleshooting tasks.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
       {
        role_id: uuidv4(),
        name: "Back-End Developer",
        description: "Handles the technical implementation and resolution of issues, including coding and troubleshooting tasks.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "ICT Support",
        description: "Provides IT support, monitors systems, and assists with issue resolution requests.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        role_id: uuidv4(),
        name: "Project Manager",
        description: "Responsible for overseeing project progress, approvals, and high-level decision making.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};