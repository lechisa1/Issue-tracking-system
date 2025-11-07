const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const {
  validateProject,
  validateProjectId,
  handleValidationErrors,
} = require("../validators/projectValidator");

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         project_id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the project
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Name of the project
 *         description:
 *           type: string
 *           description: Description of the project
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the project is active
 *         institute_id:
 *           type: string
 *           format: uuid
 *           description: Optional institute ID to associate with the project
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         deleted_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Creates a new project and optionally associates it with an institute
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Name of the project
 *               description:
 *                 type: string
 *                 description: Description of the project
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the project is active
 *               institute_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional institute ID to associate with the project
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request - validation error or project already exists
 *       404:
 *         description: Institute not found (if institute_id provided)
 *       500:
 *         description: Internal server error
 */
router.post("/", validateProject, handleValidationErrors, projectController.createProject);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieves all projects with their associated institutes and hierarchies
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       500:
 *         description: Internal server error
 */
router.get("/", projectController.getProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieves a specific project by its ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", validateProjectId, handleValidationErrors, projectController.getProjectById);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     description: Updates an existing project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Name of the project
 *               description:
 *                 type: string
 *                 description: Description of the project
 *               is_active:
 *                 type: boolean
 *                 description: Whether the project is active
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", validateProject, handleValidationErrors, projectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     description: Deletes a project (soft delete)
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", validateProjectId, handleValidationErrors, projectController.deleteProject);

module.exports = router;
