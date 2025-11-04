const express = require("express");
const router = express.Router();
const WoredaController = require("../controllers/woredaController");
const {
  validateCreateWoreda,
  validateUpdateWoreda,
} = require("../validators/woredaValidator");

//  endpoints for Woredas

router.post("/", validateCreateWoreda, WoredaController.createWoreda);
router.get("/", WoredaController.getWoredas);
router.get("/:id", WoredaController.getWoredaById);
router.put("/:id", validateUpdateWoreda, WoredaController.updateWoreda);
router.delete("/:id", WoredaController.deleteWoreda);

module.exports = router;
