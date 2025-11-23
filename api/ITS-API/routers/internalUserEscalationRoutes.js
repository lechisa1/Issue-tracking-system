const express = require("express");
const router = express.Router();
const controller = require("../controllers/Issue/internalUserEscalationController");
const {
  validateEscalateIssue,
} = require("../validators/issueEscalationValidator");
const { authenticateToken } = require("../middlewares/authMiddleware");
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
 *   name: Internal User Escalations
 *   description: Manage internal user escalations and issues
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InternalEscalationRequest:
 *       type: object
 *       required:
 *         - issue_id
 *         - from_tier
 *         - escalated_by
 *       properties:
 *         issue_id:
 *           type: string
 *           format: uuid
 *         from_tier:
 *           type: string
 *         to_tier:
 *           type: string
 *         reason:
 *           type: string
 *         escalated_by:
 *           type: string
 *           format: uuid
 *         attachment_ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 */

/**
 * @swagger
 * /api/internal-user-escalations:
 *   post:
 *     summary: Escalate an issue to internal users
 *     tags: [Internal User Escalations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InternalEscalationRequest'
 *     responses:
 *       201:
 *         description: Issue escalated successfully
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Issue or user not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/assign", validateEscalateIssue, controller.escalateInternalIssue);

/**
 * @swagger
 * /api/internal-user-escalations:
 *   get:
 *     summary: Get all internal issues (assigned to QAL, QA, FED, BED)
 *     tags: [Internal User Escalations]
 *     responses:
 *       200:
 *         description: List of internal issues
 *       500:
 *         description: Internal Error
 */
router.get("/", authenticateToken, controller.getInternalIssues);

/**
 * @swagger
 * /api/internal-user-escalations/{issue_id}:
 *   get:
 *     summary: Get internal issue details by ID
 *     tags: [Internal User Escalations]
 *     parameters:
 *       - in: path
 *         name: issue_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: Internal issue details
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Error
 */
router.get("/:issue_id", authenticateToken, controller.getInternalIssueById);

/**
 * @swagger
 * /api/internal-user-escalations/{issue_id}:
 *   put:
 *     summary: Update internal issue
 *     tags: [Internal User Escalations]
 *     parameters:
 *       - in: path
 *         name: issue_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               priority_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Issue updated successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Error
 */
router.put("/:issue_id", authenticateToken, controller.updateInternalIssue);

/**
 * @swagger
 * /api/internal-user-escalations/{issue_id}:
 *   delete:
 *     summary: Delete internal issue
 *     tags: [Internal User Escalations]
 *     parameters:
 *       - in: path
 *         name: issue_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       204:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Error
 */
router.delete("/:issue_id", authenticateToken, controller.deleteInternalIssue);

/**
 * @swagger
 * /api/internal-user-escalations/{issue_id}/attachments:
 *   post:
 *     summary: Add attachment to internal issue
 *     tags: [Internal User Escalations]
 *     parameters:
 *       - in: path
 *         name: issue_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attachment_id
 *             properties:
 *               attachment_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Attachment added successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Error
 */
router.post("/:issue_id/attachments", controller.addAttachmentToInternalIssue);

/**
 * @swagger
 * /api/internal-user-escalations/users/{id}:
 *   get:
 *     summary: Get internal users by issue project
 *     tags: [Internal User Escalations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Issue ID
 *     responses:
 *       200:
 *         description: List of internal users for the issue's project
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Issue or project not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/users/:id", authenticateToken, controller.getInternalUsersByIssueProject);

router.post("/assign-qa", require("../middlewares/authMiddleware").authenticateToken, controller.assignToQATeam);

module.exports = router;
