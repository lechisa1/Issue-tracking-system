"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("projects", [
      {
        project_id: uuidv4(),
        name: "National Digital ID System",
        description:
          "A project to implement a secure digital identification system for citizens.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        project_id: uuidv4(),
        name: "E-Government Services Platform",
        description:
          "A project to centralize government services online for ease of access and transparency.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        project_id: uuidv4(),
        name: "Smart City Infrastructure",
        description:
          "Development of smart city technologies including IoT integration, traffic management, and energy optimization.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        project_id: uuidv4(),
        name: "National Cybersecurity Enhancement",
        description:
          "Project to enhance national cybersecurity posture across public institutions.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        project_id: uuidv4(),
        name: "AI Research and Development",
        description:
          "Establishing AI research labs and projects to drive technological innovation in Ethiopia.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("projects", null, {});
  },
};
