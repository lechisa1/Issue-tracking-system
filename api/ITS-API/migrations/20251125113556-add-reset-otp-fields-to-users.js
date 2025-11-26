"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "reset_otp", {
      type: Sequelize.STRING(6),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "reset_otp_expiry", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "otp_attempts", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn("users", "last_otp_sent_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "reset_otp");
    await queryInterface.removeColumn("users", "reset_otp_expiry");
    await queryInterface.removeColumn("users", "otp_attempts");
    await queryInterface.removeColumn("users", "last_otp_sent_at");
  },
};
