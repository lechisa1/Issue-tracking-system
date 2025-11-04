const express = require("express");
const router = express.Router();
const CityController = require("../controllers/cityController");
const {
  validateCreateCity,
  validateUpdateCity,
} = require("../validators/cityValidator");

//  endpoints for Cities

router.post("/", validateCreateCity, CityController.createCity);
router.get("/", CityController.getCities);
router.get("/:id", CityController.getCityById);
router.put("/:id", validateUpdateCity, CityController.updateCity);
router.delete("/:id", CityController.deleteCity);

module.exports = router;
