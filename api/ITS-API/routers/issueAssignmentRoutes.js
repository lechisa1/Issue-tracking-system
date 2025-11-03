const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/Issue/issueAssignmentController");

/**
 * @swagger
 * tags:
 *   name: IssueAssignments
 *   description: Issue assignment management endpoints
 */

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Assign an issue to a developer or QA
 *     tags: [IssueAssignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - issue_id
 *               - assignee_id
 *               - assigned_by
 *             properties:
 *               issue_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the issue being assigned
 *               assignee_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user being assigned to the issue
 *               assigned_by:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user performing the assignment
 *               remarks:
 *                 type: string
 *                 description: Optional remarks for the assignment
 *     responses:
 *       201:
 *         description: Issue assigned successfully
 *       400:
 *         description: Missing or invalid input data
 *       404:
 *         description: Issue or user not found
 */
router.post("/", assignmentController.assignIssue);

/**
 * @swagger
 * /api/assignments/issue/{issue_id}:
 *   get:
 *     summary: Get all assignments for a specific issue
 *     tags: [IssueAssignments]
 *     parameters:
 *       - in: path
 *         name: issue_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the issue
 *     responses:
 *       200:
 *         description: List of assignments for the issue
 *       404:
 *         description: Issue not found or no assignments found
 */
router.get("/issue/:issue_id", assignmentController.getAssignmentsByIssueId);

/**
 * @swagger
 * /api/assignments/{id}:
 *   put:
 *     summary: Update assignment status or remarks
 *     tags: [IssueAssignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, rejected]
 *                 description: Updated status of the assignment
 *               remarks:
 *                 type: string
 *                 description: Optional remarks or feedback
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       404:
 *         description: Assignment not found
 *       400:
 *         description: Invalid request data
 */
router.put("/:id", assignmentController.updateAssignmentStatus);

module.exports = router;
