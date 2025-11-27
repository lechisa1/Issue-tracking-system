const express = require("express");
const router = express.Router();
const controller = require("../controllers/Issue/issueEscalationController");
const { validateEscalateIssue } = require("../validators/issueEscalationValidator");
const multer = require("multer");


console.log("Issue Escalation Route Loaded");
console.log("Validator Loaded:", validateEscalateIssue ? "Yes" : "No");
console.log("Controller Loaded:", controller ? "Yes" : "No");
// ----------------------------
// Multer configuration
// ----------------------------
const upload = multer({
  storage: multer.memoryStorage(), // store files in memory
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, TXT, JPG, JPEG, PNG files are allowed."
        ),
        false
      );
    }
  },
});

// ----------------------------
// Swagger tags
// ----------------------------
/**
 * @swagger
 * tags:
 *   name: Issue Escalations
 *   description: Manage issue escalations and history
 */

// ----------------------------
// Routes
// ----------------------------

// 1️⃣ Escalate an issue
router.post(
  "/",
  upload.array("attachments"), // optional: if you want to support multipart file upload
  validateEscalateIssue,
  controller.escalateIssue
);

// 2️⃣ Mark issue as in progress (example with auth)
router.post(
  "/mark-in-progress",
  require("../middlewares/authMiddleware").authenticateToken,
  controller.markAsInProgress
);


// 3️⃣ Get all escalations for a specific issue
router.get("/issue/:issue_id", controller.getEscalationsByIssueId);

// 4️⃣ Get escalation history for a specific issue
router.get("/history/:issue_id", controller.getEscalationHistoryByIssueId);

// 5️⃣ Get escalation by escalation ID
router.get("/id/:escalation_id", controller.getEscalationById);

// 6️⃣ Delete escalation by escalation ID
router.delete("/id/:escalation_id", controller.deleteEscalation);

// 7️⃣ Optional: get escalated issues by pairs & user
// router.get(
//   "/issues-by-pairs/:pairs/user/:user_id",
//   controller.getEscalatedIssuesWithNullTier
// );

module.exports = router;
