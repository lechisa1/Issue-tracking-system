const express = require("express");
const router = express.Router();
const controller = require("../controllers/Issue/issueEscalationController");
const {
  validateEscalateIssue,
} = require("../validators/issueEscalationValidator");
const multer = require("multer");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, JPG, JPEG, PNG files are allowed.'), false);
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Issue Escalations
 *   description: Manage issue escalations and history
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     IssueEscalation:
 *       type: object
 *       properties:
 *         escalation_id:
 *           type: string
 *           format: uuid
 *           example: "6d5a3cfa-6d5e-4d3b-8a2b-4b2e343f5a66"
 *         issue_id:
 *           type: string
 *           format: uuid
 *           example: "8c7b6d5a-4e3c-2b1a-9f8e-7d6c5b4a3e2f"
 *         from_tier:
 *           type: string
 *           example: "Tier 1"
 *         to_tier:
 *           type: string
 *           example: "Tier 2"
 *         reason:
 *           type: string
 *           example: "Requires specialized knowledge"
 *         escalated_by:
 *           type: string
 *           format: uuid
 *           example: "9e8d7c6b-5a4b-3c2d-1e0f-8a7b6c5d4e3f"
 *         escalated_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 *     IssueEscalationHistory:
 *       type: object
 *       properties:
 *         issue_escalation_history_id:
 *           type: string
 *           format: uuid
 *           example: "6d5a3cfa-6d5e-4d3b-8a2b-4b2e343f5a66"
 *         issue_id:
 *           type: string
 *           format: uuid
 *           example: "8c7b6d5a-4e3c-2b1a-9f8e-7d6c5b4a3e2f"
 *         from_tier:
 *           type: string
 *           example: "Tier 1"
 *         to_tier:
 *           type: string
 *           example: "Tier 2"
 *         escalated_by:
 *           type: string
 *           format: uuid
 *           example: "9e8d7c6b-5a4b-3c2d-1e0f-8a7b6c5d4e3f"
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     EscalationRequest:
 *       type: object
 *       required:
 *         - issue_id
 *         - from_tier
 *         - to_tier
 *         - escalated_by
 *       properties:
 *         issue_id:
 *           type: string
 *           format: uuid
 *           example: "8c7b6d5a-4e3c-2b1a-9f8e-7d6c5b4a3e2f"
 *         from_tier:
 *           type: string
 *           example: "Tier 1"
 *         to_tier:
 *           type: string
 *           example: "Tier 2"
 *         reason:
 *           type: string
 *           example: "Requires specialized knowledge"
 *         escalated_by:
 *           type: string
 *           format: uuid
 *           example: "9e8d7c6b-5a4b-3c2d-1e0f-8a7b6c5d4e3f"
 */

/**
 * @swagger
 * /api/issue-escalations:
 *   post:
 *     summary: Escalate an issue to a higher tier
 *     tags: [Issue Escalations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EscalationRequest'
 *     responses:
 *       201:
 *         description: Issue escalated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IssueEscalation'
 *       400:
 *         description: Bad Request - Missing required fields
 *       404:
 *         description: Issue or user not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/issue-escalations/issue/{issue_id}:
 *   get:
 *     summary: Get all escalations for a specific issue
 *     tags: [Issue Escalations]
 *     parameters:
 *       - in: path
 *         name: issue_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The issue UUID
 *     responses:
 *       200:
 *         description: List of escalations for the issue
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IssueEscalation'
 *       404:
 *         description: No escalations found for this issue
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/issue-escalations/history/{issue_id}:
 *   get:
 *     summary: Get escalation history for a specific issue
 *     tags: [Issue Escalations]
 *     parameters:
 *       - in: path
 *         name: issue_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The issue UUID
 *     responses:
 *       200:
 *         description: List of escalation history records for the issue
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IssueEscalationHistory'
 *       404:
 *         description: No escalation history found for this issue
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/issue-escalations/{escalation_id}:
 *   get:
 *     summary: Get escalation details by ID
 *     tags: [Issue Escalations]
 *     parameters:
 *       - in: path
 *         name: escalation_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The escalation UUID
 *     responses:
 *       200:
 *         description: Escalation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IssueEscalation'
 *       404:
 *         description: Escalation not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/issue-escalations/{escalation_id}:
 *   delete:
 *     summary: Delete an escalation record
 *     tags: [Issue Escalations]
 *     parameters:
 *       - in: path
 *         name: escalation_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The escalation UUID
 *     responses:
 *       204:
 *         description: Escalation deleted successfully
 *       404:
 *         description: Escalation not found
 *       500:
 *         description: Internal Server Error
 */

// Routes
router.post("/", validateEscalateIssue, controller.escalateIssue);
router.post("/automated", upload.array('attachments', 10), controller.automatedEscalation);
router.post("/assign-qa", controller.assignToQATeam);
router.post("/assign-developer", controller.assignToDeveloper);
router.post("/mark-in-progress", require("../middlewares/authMiddleware").authenticateToken, controller.markAsInProgress);
router.get("/:issue_id", controller.getEscalationsByIssueId);
router.get("/history/:issue_id", controller.getEscalationHistoryByIssueId);
router.get("/:escalation_id", controller.getEscalationById);
router.delete("/:escalation_id", controller.deleteEscalation);

module.exports = router;
