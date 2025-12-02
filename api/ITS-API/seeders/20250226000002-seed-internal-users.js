"use strict";

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1️⃣ Get internal_user type ID
    const [userType] = await queryInterface.sequelize.query(
      `SELECT user_type_id FROM user_types WHERE name = 'internal_user' LIMIT 1`
    );

    if (!userType.length) {
      throw new Error("internal_user type not found in user_types table");
    }

    const internalUserTypeId = userType[0].user_type_id;

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // 3️⃣ Seed 3 internal users
    const users = [
      {
        user_id: uuidv4(),
        full_name: "Admin One",
        email: "admin1@example.com",
        password: hashedPassword,
        phone_number: "0900000001",
        user_type_id: internalUserTypeId,
        institute_id: null,
        hierarchy_node_id: null,
        internal_node_id: null,
        position: "Administrator",
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
        full_name: "Admin Two",
        email: "admin2@example.com",
        password: hashedPassword,
        phone_number: "0900000002",
        user_type_id: internalUserTypeId,
        institute_id: null,
        hierarchy_node_id: null,
        internal_node_id: null,
        position: "System Manager",
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
        full_name: "Admin Three",
        email: "admin3@example.com",
        password: hashedPassword,
        phone_number: "0900000003",
        user_type_id: internalUserTypeId,
        institute_id: null,
        hierarchy_node_id: null,
        internal_node_id: null,
        position: "Coordinator",
        profile_image: null,
        is_first_logged_in: true,
        last_login_at: null,
        password_changed_at: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("users", users);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", {
      email: ["admin1@example.com", "admin2@example.com", "admin3@example.com"],
    });
  },
};
