// "use strict";
// const { v4: uuidv4 } = require("uuid");
// const bcrypt = require("bcrypt");

// module.exports = {
//   async up(queryInterface, Sequelize) {
//     const now = new Date();

//     const passwordHash = await bcrypt.hash("Password123!", 10);

//     await queryInterface.bulkInsert("users", [
//       {
//         user_id: uuidv4(),
//         full_name: "John Doe",
//         email: "john.doe@example.com",
//         password: passwordHash,
//         user_type_id: "1bd1a1f5-3615-408e-ae60-049473bd74da",
//         institute_id: null,
//         position: "Software Engineer",
//         phone_number: "251911234567",
//         profile_image: null,
//         is_first_logged_in: true,
//         last_login_at: null,
//         password_changed_at: null,
//         is_active: true,
//         created_at: now,
//         updated_at: now,
//       },
//       {
//         user_id: uuidv4(),
//         full_name: "Jane Smith",
//         email: "jane.smith@example.com",
//         password: passwordHash,
//         user_type_id: "f08af19a-22b6-4def-a398-33f179be0c20",
//         institute_id: null,
//         position: "Project Manager",
//         phone_number: "251911234568",
//         profile_image: null,
//         is_first_logged_in: true,
//         last_login_at: null,
//         password_changed_at: null,
//         is_active: true,
//         created_at: now,
//         updated_at: now,
//       },
//     ]);
//   },

//   async down(queryInterface, Sequelize) {
//     await queryInterface.bulkDelete("users", null, {});
//   },
// };

// instituteId: 2f7c3b21-2d19-4e58-a053-e1995b1c8a6d
// userType: 1bd1a1f5-3615-408e-ae60-049473bd74da

"use strict";
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const instituteId = "2a428304-ef45-4128-8c9e-66074517bf08";
    const userTypeId = "c469f531-a88d-46a1-8196-d765f54eee08";

    const passwordHash = await bcrypt.hash("Password123!", 10);

    await queryInterface.bulkInsert("users", [
      // -----------------------
      // CCC (2 Users)
      // -----------------------
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

      // -----------------------
      // RRR (2 Users)
      // -----------------------
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

      // -----------------------
      // SSS (2 Users)
      // -----------------------
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

      // -----------------------
      // A1A (2 Users)
      // -----------------------
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
