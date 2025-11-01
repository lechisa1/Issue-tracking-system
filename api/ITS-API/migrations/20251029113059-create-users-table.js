"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      user_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      user_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "user_types",
          key: "user_type_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      institute_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "institutes",
          key: "institute_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      position: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      is_first_logged_in: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      password_changed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      profile_image: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // indexes for better performance
    await queryInterface.addIndex("users", ["email"]);
    await queryInterface.addIndex("users", ["phone_number"]);
    await queryInterface.addIndex("users", ["user_type_id"]);
    await queryInterface.addIndex("users", ["institute_id"]);
    await queryInterface.addIndex("users", ["is_active"]);
    await queryInterface.addIndex("users", ["created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};