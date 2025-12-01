"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1️⃣ Add column as NULLABLE first
    await queryInterface.addColumn("issues", "ticket_number", {
      type: Sequelize.STRING(30),
      allowNull: true, // MUST be nullable first
      unique: true,
    });

    // 2️⃣ Generate sequential ticket numbers
    const [issues] = await queryInterface.sequelize.query(
      `SELECT issue_id, created_at 
       FROM "issues"
       ORDER BY created_at ASC`
    );

    let seq = 0;

    for (const issue of issues) {
      const year = new Date(issue.created_at).getFullYear();
      const padded = String(seq).padStart(6, "0");

      const ticket = `TICK-${year}-${padded}`;

      await queryInterface.sequelize.query(
        `UPDATE "issues"
         SET ticket_number = '${ticket}'
         WHERE issue_id = '${issue.issue_id}'`
      );

      seq++;
    }

    // 3️⃣ Make the column NOT NULL now that all rows are filled
    await queryInterface.changeColumn("issues", "ticket_number", {
      type: Sequelize.STRING(30),
      allowNull: false,
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("issues", "ticket_number");
  },
};
