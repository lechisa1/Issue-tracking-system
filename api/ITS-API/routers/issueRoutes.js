const express = require("express");
const router = express.Router();
const issueController = require("../controllers/Issue/issueController");
const {
  validateCreateIssue,
  validateUpdateIssue,
  validateGetIssuesQuery,
  validateIssueIdParam,
} = require("../validators/issueValidator");
const { authenticateToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  acceptIssue,
  resolveIssue,
  escalateIssueToParent,
} = require("../controllers/flowTestController");
/**
 * @swagger
 * tags:
 *   name: Issues
 *   description: Issue management endpoints
 */

/**
 * @swagger
 * /api/issues:
 *   post:
 *     summary: Create a new issue
 *     tags: [Issues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - project_id
 *               - issue_category_id
 *               - priority_id
 *               - reported_by
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               issue_category_id:
 *                 type: string
 *                 format: uuid
 *               priority_id:
 *                 type: string
 *                 format: uuid
 *               reported_by:
 *                 type: string
 *                 format: uuid
 *               current_tier:
 *                 type: string
 *               assigned_to:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Issue created successfully
 *       400:
 *         description: Bad request
 */
// router.post("/", validateCreateIssue, issueController.createIssue);

/**
 * @swagger
 * /api/issues:
 *   get:
 *     summary: Get all issues
 *     tags: [Issues]
 *     responses:
 *       200:
 *         description: List of issues
 */
router.get("/", validateGetIssuesQuery, issueController.getIssues);
router.post(
  "",
  authenticateToken,
  upload.array("attachments"),
  issueController.createIssueWithAttachments
);
router.get("/from-child", authenticateToken, issueController.getMyIssues);
router.patch("/:issue_id/accept", authenticateToken, acceptIssue);

router.patch("/:issue_id/resolve", authenticateToken, resolveIssue);

router.patch("/:issue_id/escalate", authenticateToken, escalateIssueToParent);
router.patch(
  "/:issue_id",
  authenticateToken,
  upload.array("attachments"),
  issueController.updateIssueWithAttachments
);
/**
 * @swagger
 * /api/issues/{id}:
 *   get:
 *     summary: Get issue by ID
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Issue ID
 *     responses:
 *       200:
 *         description: Issue data
 *       404:
 *         description: Issue not found
 */
router.get("/:id", validateIssueIdParam, issueController.getIssueById);

/**
 * @swagger
 * /api/issues/{id}:
 *   put:
 *     summary: Update an issue
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Issue ID
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
 *               current_tier:
 *                 type: string
 *               assigned_to:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Issue updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Issue not found
 */
router.put(
  "/:id",
  validateIssueIdParam,
  validateUpdateIssue,
  issueController.updateIssue
);

/**
 * @swagger
 * /api/issues/{id}:
 *   delete:
 *     summary: Delete an issue
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Issue ID
 *     responses:
 *       200:
 *         description: Issue deleted
 *       404:
 *         description: Issue not found
 */

router.delete("/:id", validateIssueIdParam, issueController.deleteIssue);

module.exports = router;
