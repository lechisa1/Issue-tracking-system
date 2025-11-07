/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated project ID
 *         name:
 *           type: string
 *           description: The name of the project
 *         description:
 *           type: string
 *           description: Brief description of the project
 *         start_date:
 *           type: string
 *           format: date
 *           description: The date when the project starts
 *         end_date:
 *           type: string
 *           format: date
 *           description: The date when the project ends
 *         project_manager_id:
 *           type: integer
 *           description: ID of the assigned project manager
 *         institute_id:
 *           type: integer
 *           description: ID of the associated institute
 *         status:
 *           type: string
 *           description: Current project status (e.g., Active, Completed)
 *       example:
 *         id: 1
 *         name: Issue Tracking System
 *         description: A web-based platform for managing software issues
 *         start_date: 2025-01-10
 *         end_date: 2025-06-15
 *         project_manager_id: 3
 *         institute_id: 2
 *         status: Active
 */

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management API
 */

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Invalid input
 *
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of all projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *
 *   put:
 *     summary: Update an existing project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Project not found
 *
 *   delete:
 *     summary: Delete a project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 */

const express = require("express");
const router = express.Router();
const ProjectController = require("../controllers/projectController");
const {
  validateCreateProject,
  validateUpdateProject,
} = require("../validators/projectValidator");

// endpoints for Projects
router.post("/", validateCreateProject, ProjectController.createProject);
router.get("/", ProjectController.getProjects);
router.get("/:id", ProjectController.getProjectById);
router.put("/:id", validateUpdateProject, ProjectController.updateProject);
router.delete("/:id", ProjectController.deleteProject);

module.exports = router;
