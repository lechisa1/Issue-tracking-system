"use strict";
const { v4: uuidv4 } = require("uuid");
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("issue_priorities", [
      { priority_id:uuidv4(),name: "Low", description: "Low priority issue", created_at: new Date(), updated_at: new Date() },
      { priority_id:uuidv4(),name: "Medium", description: "Medium priority issue", created_at: new Date(), updated_at: new Date() },
      { priority_id:uuidv4(),name: "High", description: "High priority issue", created_at: new Date(), updated_at: new Date() },
      { priority_id:uuidv4(),name: "Critical", description: "Critical priority issue", created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("issue_priorities", null, {});
  },
};
