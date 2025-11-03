"use strict";
const { v4: uuidv4 } = require("uuid");
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("issue_categories", [
      { category_id: uuidv4(),name: "Bug", description: "Software bug or defect", created_at: new Date(), updated_at: new Date() },
      { category_id: uuidv4(),name: "Feature Request", description: "Request for new functionality", created_at: new Date(), updated_at: new Date() },
      { category_id: uuidv4(),name: "Improvement", description: "Enhancement to existing functionality", created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("issue_categories", null, {});
  },
};
