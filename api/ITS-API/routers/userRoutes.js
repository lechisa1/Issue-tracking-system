const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  validateCreateUser,
  validateUpdateUser,
} = require("../validators/userValidator");
//  endpoints go here with swagger
router.post("/",validateCreateUser, userController.createUser);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put("/:id",validateUpdateUser, userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
