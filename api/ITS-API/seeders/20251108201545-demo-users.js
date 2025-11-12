"use strict";
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const passwordHash = await bcrypt.hash("Password123!", 10);

    await queryInterface.bulkInsert("users", [
      {
        user_id: uuidv4(),
        full_name: "John Doe",
        email: "john.doe@example.com",
        password: passwordHash,
        user_type_id: "8c399af8-5ffd-4033-8955-f5e27a5187d8",
        institute_id: null,
        position: "Software Engineer",
        phone_number: "251911234567",
        profile_image: null,
        is_first_logged_in: true,
        last_login_at: null,
        password_changed_at: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: uuidv4(),
        full_name: "Jane Smith",
        email: "jane.smith@example.com",
        password: passwordHash,
        user_type_id: "8c399af8-5ffd-4033-8955-f5e27a5187d8",
        institute_id: null,
        position: "Project Manager",
        phone_number: "251911234568",
        profile_image: null,
        is_first_logged_in: true,
        last_login_at: null,
        password_changed_at: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
