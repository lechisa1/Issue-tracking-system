"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Function to load models from a specific folder
function loadModelsFromFolder(folderName) {
  const folderPath = path.join(__dirname, folderName);

  // Check if folder exists
  if (!fs.existsSync(folderPath)) {
    console.log(`Folder ${folderName} does not exist, skipping...`);
    return;
  }

  console.log(`Loading models from ${folderName}...`);

  fs.readdirSync(folderPath)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 &&
        file.slice(-3) === ".js" &&
        file.indexOf(".test.js") === -1
      );
    })
    .forEach((file) => {
      const modelPath = path.join(folderPath, file);
      try {
        const model = require(modelPath)(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
      } catch (error) {
        console.error(`Error loading model from ${file}:`, error.message);
      }
    });
}

loadModelsFromFolder("."); // Root models folder (for User, Permission, etc.)
loadModelsFromFolder("Issue"); // Issue-related models

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
