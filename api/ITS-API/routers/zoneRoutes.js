const express = require("express");
const router = express.Router();
const ZoneController = require("../controllers/zoneController");
const {
  validateCreateZone,
  validateUpdateZone,
} = require("../validators/zoneValidator");

//  endpoints for Zones

router.post("/", validateCreateZone, ZoneController.createZone);
router.get("/", ZoneController.getZones);
router.get("/:id", ZoneController.getZoneById);
router.put("/:id", validateUpdateZone, ZoneController.updateZone);
router.delete("/:id", ZoneController.deleteZone);

module.exports = router;
