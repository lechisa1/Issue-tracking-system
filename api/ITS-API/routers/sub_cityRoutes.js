const express = require("express");
const router = express.Router();
const Sub_cityController = require("../controllers/sub-cityController");
const {
  validateCreateSub_city,
  validateUpdateSub_city,
} = require("../validators/sub_cityValidator");

//  endpoints for Sub_citys

router.post("/", validateCreateSub_city, Sub_cityController.createSub_city);
router.get("/", Sub_cityController.getSub_citys);
router.get("/:id", Sub_cityController.getSub_cityById);
router.put("/:id", validateUpdateSub_city, Sub_cityController.updateSub_city);
router.delete("/:id", Sub_cityController.deleteSub_city);

module.exports = router;
