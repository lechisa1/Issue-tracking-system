const express = require("express");
const router = express.Router();
const hierarchyController = require("../controllers/hierarchyController");
const {
  validateHierarchy,
  validateHierarchyId,
  handleValidationErrors,
} = require("../validators/hierarchyValidator");

/**
 * @swagger
 * components:
 *   schemas:
 *     Hierarchy:
 *       type: object
 *       required:
 *         - name
 *         - project_id
 *       properties:
 *         hierarchy_id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the hierarchy
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Name of the hierarchy
 *         project_id:
 *           type: string
 *           format: uuid
 *           description: ID of the associated project
 *         parent_id:
 *           type: string
 *           format: uuid
 *           description: ID of the parent hierarchy (null for root hierarchies)
 *         description:
 *           type: string
 *           description: Description of the hierarchy
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the hierarchy is active
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
 * /api/hierarchies:
 *   post:
 *     summary: Create a new hierarchy
 *     description: Creates a new hierarchy structure for a project
 *     tags: [Hierarchies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - name
 *                   - project_id
 *                 properties:
 *                   name:
 *                     type: string
 *                     maxLength: 255
 *                     description: Name of the hierarchy
 *                   project_id:
 *                     type: string
 *                     format: uuid
 *                     description: ID of the project this hierarchy belongs to
 *                   parent_id:
 *                     type: string
 *                     format: uuid
 *                     description: ID of the parent hierarchy (null for root hierarchies)
 *                   description:
 *                     type: string
 *                     description: Description of the hierarchy
 *                   is_active:
 *                     type: boolean
 *                     default: true
 *                     description: Whether the hierarchy is active
 *               - type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - project_id
 *                   properties:
 *                     name:
 *                       type: string
 *                       maxLength: 255
 *                       description: Name of the hierarchy
 *                     project_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the project this hierarchy belongs to
 *                     parent_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the parent hierarchy (null for root hierarchies)
 *                     description:
 *                       type: string
 *                       description: Description of the hierarchy
 *                     is_active:
 *                       type: boolean
 *                       default: true
 *                       description: Whether the hierarchy is active
 *     responses:
 *       201:
 *         description: Hierarchy created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hierarchy'
 *       400:
 *         description: Bad request - validation error or hierarchy already exists
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.post("/", validateHierarchy, handleValidationErrors, hierarchyController.createHierarchy);

/**
 * @swagger
 * /api/hierarchies:
 *   get:
 *     summary: Get all hierarchies
 *     description: Retrieves all hierarchies with their associated projects and nodes
 *     tags: [Hierarchies]
 *     responses:
 *       200:
 *         description: List of hierarchies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hierarchy'
 *       500:
 *         description: Internal server error
 */
router.get("/", hierarchyController.getHierarchies);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   get:
 *     summary: Get hierarchy by ID
 *     description: Retrieves a specific hierarchy by its ID
 *     tags: [Hierarchies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy ID
 *     responses:
 *       200:
 *         description: Hierarchy details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hierarchy'
 *       404:
 *         description: Hierarchy not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", validateHierarchyId, handleValidationErrors, hierarchyController.getHierarchyById);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   put:
 *     summary: Update hierarchy
 *     description: Updates an existing hierarchy
 *     tags: [Hierarchies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy ID
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
 *                 description: Name of the hierarchy
 *               project_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the project this hierarchy belongs to
 *               description:
 *                 type: string
 *                 description: Description of the hierarchy
 *               is_active:
 *                 type: boolean
 *                 description: Whether the hierarchy is active
 *     responses:
 *       200:
 *         description: Hierarchy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hierarchy'
 *       404:
 *         description: Hierarchy not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", validateHierarchy, handleValidationErrors, hierarchyController.updateHierarchy);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   delete:
 *     summary: Delete hierarchy
 *     description: Deletes a hierarchy (soft delete)
 *     tags: [Hierarchies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy ID
 *     responses:
 *       200:
 *         description: Hierarchy deleted successfully
 *       404:
 *         description: Hierarchy not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", validateHierarchyId, handleValidationErrors, hierarchyController.deleteHierarchy);

module.exports = router;
