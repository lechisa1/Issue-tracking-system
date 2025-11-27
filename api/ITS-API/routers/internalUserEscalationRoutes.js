const express = require("express");
const router = express.Router();
const {
  createEscalation,
  getEscalationHistory,
  getUserTasks,
  getAllEscalations,
  getEscalationById,
  updateEscalation,
  deleteEscalation,
} = require("../controllers/Issue/internalUserEscalationController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { validateCreateEscalation } = require("../validators/internalUserEscalationValidator");

router.use(authenticateToken);

// Use multer middleware for file uploads on create escalation route
router.post("/", upload.array("attachments[]", 10), createEscalation);

router.get("/", getAllEscalations);
router.get("/tasks", getUserTasks);
router.get("/:id", getEscalationById);
router.get("/history/:issueId", getEscalationHistory);
router.put("/:id", updateEscalation);
router.delete("/:id", deleteEscalation);

module.exports = router;
