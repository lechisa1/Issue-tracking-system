const express = require("express");
const router = express.Router();
const hierarchyController = require("../controllers/hierarchyController");
const {
  validateCreateHierarchy,
  validateUpdateHierarchy,
  validateHierarchyId,
} = require("../validators/hierarchyValidator");

/**
 * @swagger
 * components:
 *   schemas:
 *     Hierarchy:
 *       type: object
 *       properties:
 *         hierarchy_id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the hierarchy
 *         name:
 *           type: string
 *           example: City Hierarchy
 *         project_id:
 *           type: string
 *           format: uuid
 *           description: ID of the associated project
 *         parent_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Parent hierarchy ID (if any)
 *         description:
 *           type: string
 *           example: Defines city-level hierarchy with sub-city and woreda
 *         levels:
 *           type: object
 *           example: { "1": "city", "2": "sub_city", "3": "woreda" }
 *         is_active:
 *           type: boolean
 *           default: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   - name: Hierarchies
 *     description: API endpoints for managing hierarchy structures
 */

/**
 * @swagger
 * /api/hierarchies:
 *   post:
 *     summary: Create a new hierarchy or multiple hierarchies
 *     description: Supports both single and bulk hierarchy creation
 *     tags: [Hierarchies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/Hierarchy'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/Hierarchy'
 *     responses:
 *       201:
 *         description: Hierarchy/Hierarchies created successfully
 *       400:
 *         description: Validation error or duplicate hierarchy name
 *       500:
 *         description: Internal server error
 */
router.post("/", validateCreateHierarchy, hierarchyController.createHierarchy);

/**
 * @swagger
 * /api/hierarchies:
 *   get:
 *     summary: Get all hierarchies
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
 *       404:
 *         description: Hierarchy not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", validateHierarchyId, hierarchyController.getHierarchyById);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   put:
 *     summary: Update an existing hierarchy
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
 *             $ref: '#/components/schemas/Hierarchy'
 *     responses:
 *       200:
 *         description: Hierarchy updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Hierarchy not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  validateHierarchyId,
  validateUpdateHierarchy,
  hierarchyController.updateHierarchy
);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   delete:
 *     summary: Delete a hierarchy by ID
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
router.delete("/:id", validateHierarchyId, hierarchyController.deleteHierarchy);

module.exports = router;
