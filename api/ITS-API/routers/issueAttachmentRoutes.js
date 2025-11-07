const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  uploadMultipleAttachments,
  deleteAttachments,
  getAttachmentsByIssueId,
  deleteAttachmentById,
} = require("../controllers/issueAttachmentController");

// Upload multiple attachments
router.post(
  "/",
  authenticateToken,
  upload.array("files", 10),
  uploadMultipleAttachments
);

// Delete all attachments by issue_id
router.delete("/", authenticateToken, deleteAttachments);
router.get("/:issue_id", authenticateToken, getAttachmentsByIssueId);

// Delete single attachment by attachment_id
router.delete("/:attachment_id", authenticateToken, deleteAttachmentById);
/**
 * @swagger
 * /api/issue-file-attachment:
 *   post:
 *     summary: Upload, replace, or update issue attachments
 *     description: >
 *       Upload multiple files related to an issue.
 *       You can optionally replace all existing files or only specific ones.
 *       Requires a valid JWT token in the **Authorization** header.
 *     tags:
 *       - Issue Attachments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               issue_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the issue the files belong to.
 *               replace_all:
 *                 type: boolean
 *                 description: If true, replaces all existing files for this issue.
 *               replace_files:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of specific file names to replace.
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 10 files).
 *     responses:
 *       201:
 *         description: Files uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       file_name:
 *                         type: string
 *                       file_path:
 *                         type: string
 *       400:
 *         description: No files uploaded or bad request.
 *       401:
 *         description: Missing or invalid JWT token.
 *       500:
 *         description: Server error.
 */

/**
 * @swagger
 * /api/issue-file-attachment/{issue_id}:
 *   get:
 *     summary: Get all attachments for a specific issue
 *     description: >
 *       Retrieve all attachments (file names, paths, uploaded user, timestamps)
 *       associated with the given issue ID.
 *       Requires a valid JWT token in the **Authorization** header.
 *     tags:
 *       - Issue Attachments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: issue_id
 *         in: path
 *         required: true
 *         description: The issue ID to fetch attachments for.
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: List of attachments retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 attachments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       file_name:
 *                         type: string
 *                         example: "report.pdf"
 *                       file_path:
 *                         type: string
 *                         example: "uploads/issues/123e4567/report.pdf"
 *                       uploaded_by:
 *                         type: string
 *                         example: "user_001"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-07T10:00:00Z"
 *       400:
 *         description: Missing or invalid issue_id.
 *       401:
 *         description: Unauthorized (invalid token).
 *       404:
 *         description: No attachments found for this issue.
 *       500:
 *         description: Server error.
 */
/**
 * @swagger
 * /api/issue-file-attachment:
 *   delete:
 *     summary: Delete all attachments for a specific issue
 *     description: >
 *       Delete **all attachments** related to a given issue ID.
 *       Files are deleted both from the database and local storage.
 *       Requires a valid JWT token in the **Authorization** header.
 *     tags:
 *       - Issue Attachments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - issue_id
 *             properties:
 *               issue_id:
 *                 type: string
 *                 format: uuid
 *                 description: The ID of the issue whose attachments will be deleted.
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: All attachments deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All 4 attachments deleted successfully
 *                 deleted_by:
 *                   type: string
 *                   example: "user_001"
 *       400:
 *         description: Missing issue_id.
 *       401:
 *         description: Unauthorized (invalid token).
 *       404:
 *         description: No attachments found for the given issue.
 *       500:
 *         description: Server error while deleting attachments.
 */

/**
 * @swagger
 * /api/issue-file-attachment/{attachment_id}:
 *   delete:
 *     summary: Delete a single issue attachment by ID
 *     description: >
 *       Deletes one specific attachment by its unique `attachment_id`.
 *       The file is removed from both the database and local storage.
 *       Requires a valid JWT token in the **Authorization** header.
 *     tags:
 *       - Issue Attachments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: attachment_id
 *         in: path
 *         required: true
 *         description: Unique ID of the attachment to delete.
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "b9d5d940-6a9a-4f54-83df-14d9efc5a410"
 *     responses:
 *       200:
 *         description: Attachment deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Attachment deleted successfully"
 *                 deleted_attachment:
 *                   type: object
 *                   properties:
 *                     attachment_id:
 *                       type: string
 *                       example: "b9d5d940-6a9a-4f54-83df-14d9efc5a410"
 *                     file_name:
 *                       type: string
 *                       example: "document.pdf"
 *                     deleted_by:
 *                       type: string
 *                       example: "user_123"
 *       400:
 *         description: Missing or invalid attachment_id.
 *       401:
 *         description: Unauthorized (invalid token).
 *       404:
 *         description: Attachment not found.
 *       500:
 *         description: Server error.
 */
module.exports = router;
