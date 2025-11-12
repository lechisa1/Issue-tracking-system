const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");

router.get("/", permissionController.getPermissions);
router.patch(
  "/:permission_id/activate",
  permissionController.activatePermission
);
router.patch(
  "/:permission_id/deactivate",
  permissionController.deactivatePermission
);
router.patch("/:permission_id/toggle", permissionController.togglePermission);

module.exports = router;
