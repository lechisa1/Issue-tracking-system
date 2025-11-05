const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationController");
const {
  validateCreateOrganization,
  validateUpdateOrganization,
} = require("../validators/organizationValidator");

//  endpoints go here with swagger
router.post("/", validateCreateOrganization, organizationController.createOrganization);
router.get("/", organizationController.getOrganizations);
router.get("/:id", organizationController.getOrganizationById);
router.put("/:id", validateUpdateOrganization, organizationController.updateOrganization);
router.delete("/:id", organizationController.deleteOrganization);

module.exports = router;
