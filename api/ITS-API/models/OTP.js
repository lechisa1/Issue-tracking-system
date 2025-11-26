"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OTP extends Model {
    static associate(models) {
      // Example association (optional)
      // OTP.belongsTo(models.User, {
      //   foreignKey: "user_id",
      //   as: "user",
      // });
    }
  }

  OTP.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      otp: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("PASSWORD_RESET", "PHONE_VERIFICATION"),
        defaultValue: "PASSWORD_RESET",
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "OTP",
      tableName: "otps",
      timestamps: false,
      underscored: true,
    }
  );

  return OTP;
};
