"use strict";
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ================================
    // 1. Fetch user_type_ids for external_user and internal_user
    // ================================
    const [userTypes] = await queryInterface.sequelize.query(`
      SELECT user_type_id, name
      FROM user_types
      WHERE name IN ('external_user', 'internal_user')
    `);

    if (userTypes.length < 2) {
      throw new Error(
        "User types 'external_user' and 'internal_user' not found. Seed user_types first."
      );
    }

    const externalUserType = userTypes.find(ut => ut.name === 'external_user');
    const internalUserType = userTypes.find(ut => ut.name === 'internal_user');

    if (!externalUserType || !internalUserType) {
      throw new Error(
        "Required user types not found. Seed user_types first."
      );
    }

    const userTypeId = externalUserType.user_type_id;
    const userTypeIdInternal = internalUserType.user_type_id;
    // ================================
    // 2. Fetch ONE institute_id
    // ================================
    const [inst] = await queryInterface.sequelize.query(`
      SELECT institute_id 
      FROM institutes
      ORDER BY created_at ASC
      LIMIT 1
    `);

    if (!inst.length) {
      throw new Error("No institutes found. Seed institutes first.");
    }

    const instituteId = inst[0].institute_id;

    // ================================
    // 3. Common password hash
    // ================================
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // ================================
    // 4. Insert demo users
    // ================================
    await queryInterface.bulkInsert("users", [
       {
        user_id: uuidv4(),
        full_name: "AII System Admin",
        email: "aii_system_admin@gmail.com",
        password: passwordHash,
        user_type_id: userTypeIdInternal,
        institute_id: null,
        position: "Aii System Admin",
        phone_number: "251911000111",
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
        full_name: "CCC Centeral Admin",
        email: "ccc_admin@gmail.com",
        password: passwordHash,
        user_type_id: userTypeId,
        institute_id: instituteId,
        position: "CCC_Centeral_admin",
        phone_number: "251911000001",
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
        full_name: "CCC ICT",
        email: "ccc_ict@gmail.com",
        password: passwordHash,
        user_type_id: userTypeId,
        institute_id: instituteId,
        position: "CCC_ICT",
        phone_number: "251911000002",
        profile_image: null,
        is_first_logged_in: true,
        last_login_at: null,
        password_changed_at: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // RRR Users
      {
        user_id: uuidv4(),
        full_name: "RRR Admin",
        email: "rrr_admin@gmail.com",
        password: passwordHash,
        user_type_id: userTypeId,
        institute_id: instituteId,
        position: "RRR_admin",
        phone_number: "251911000003",
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
        full_name: "RRR ICT",
        email: "rrr_ict@gmail.com",
        password: passwordHash,
        user_type_id: userTypeId,
        institute_id: instituteId,
        position: "RRR_ICT",
        phone_number: "251911000004",
        profile_image: null,
        is_first_logged_in: true,
        last_login_at: null,
        password_changed_at: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // SSS Users
      {
        user_id: uuidv4(),
        full_name: "SSS Admin",
        email: "sss_admin@gmail.com",
        password: passwordHash,
        user_type_id: userTypeId,
        institute_id: instituteId,
        position: "SSS_admin",
        phone_number: "251911000005",
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
        full_name: "SSS ICT",
        email: "sss_ict@gmail.com",
        password: passwordHash,
        user_type_id: userTypeId,
        institute_id: instituteId,
        position: "SSS_ICT",
        phone_number: "251911000006",
        profile_image: null,
        is_first_logged_in: true,
        last_login_at: null,
        password_changed_at: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // A1A Users
      {
        user_id: uuidv4(),
        full_name: "A1A Admin",
        email: "a1a_admin@gmail.com",
        password: passwordHash,
        user_type_id: userTypeId,
        institute_id: instituteId,
        position: "A1A_admin",
        phone_number: "251911000007",
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
        full_name: "A1A ICT",
        email: "a1a_ict@gmail.com",
        password: passwordHash,
        user_type_id: userTypeId,
        institute_id: instituteId,
        position: "A1A_ICT",
        phone_number: "251911000008",
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
