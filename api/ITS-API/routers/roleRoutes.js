const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const {
  validateCreateRole,
  validateUpdateRole,
} = require("../validators/roleValidator");
// CRUD endpoints
router.post("/", validateCreateRole,roleController.createRole);      
router.get("/", roleController.getRoles);         
router.get("/:id", roleController.getRoleById);   
router.put("/:id", validateUpdateRole,roleController.updateRole);   
router.delete("/:id", roleController.deleteRole); 

module.exports = router;
