const express = require("express");
const router = express.Router();
const RegionController = require("../controllers/regionController");
const {
  validateCreateRegion,
  validateUpdateRegion,
} = require("../validators/regionValidator");

//  endpoints for Regions

router.post("/", validateCreateRegion, RegionController.createRegion);
router.get("/", RegionController.getRegions);
router.get("/:id", RegionController.getRegionById);
router.put("/:id", validateUpdateRegion, RegionController.updateRegion);
router.delete("/:id", RegionController.deleteRegion);

module.exports = router;
