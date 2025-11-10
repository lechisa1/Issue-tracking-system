"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("institutes", [
      {
        institute_id: uuidv4(),
        name: "Bole Airport International",
        description:
          "A major international airport located in Addis Ababa, Ethiopia.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        institute_id: uuidv4(),
        name: "Information Network Security Agency (INSA)",
        description:
          "A national cybersecurity agency responsible for information network protection and innovation.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        institute_id: uuidv4(),
        name: "Ministry of Innovation and Technology (MInT)",
        description:
          "The federal institution responsible for innovation and technology development in Ethiopia.",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("institutes", null, {});
  },
};
