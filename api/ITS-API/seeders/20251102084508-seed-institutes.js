"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("institutes", [
      {
        institute_id: uuidv4(),
        name: "Bole Airport International",
        address: "Addis Ababa, Ethiopia",
        contact_email: "info@eai.gov.et",
        contact_phone: "+251-11-123-4567",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        institute_id: uuidv4(),
        name: "Information Network Security Agency (INSA)",
        address: "Addis Ababa, Ethiopia",
        contact_email: "contact@insa.gov.et",
        contact_phone: "+251-11-765-4321",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        institute_id: uuidv4(),
        name: "Ministry of Innovation and Technology (MInT)",
        address: "Addis Ababa, Ethiopia",
        contact_email: "info@mint.gov.et",
        contact_phone: "+251-11-555-0101",
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
