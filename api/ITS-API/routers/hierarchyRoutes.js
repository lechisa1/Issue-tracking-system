const express = require("express");
const router = express.Router();
const hierarchyController = require("../controllers/hierarchyController");
const {
  validateCreateHierarchy,
  validateUpdateHierarchy,
} = require("../validators/hierarchyValidator");

/**
 * @swagger
 * tags:
 *   name: Hierarchies
 *   description: Hierarchy management endpoints
 */

/**
 * @swagger
 * /api/hierarchies:
 *   post:
 *     summary: Create a new hierarchy
 *     tags: [Hierarchies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - project_id
 *             properties:
 *               name:
 *                 type: string
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Hierarchy created successfully
 *       400:
 *         description: Bad request
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
 *         description: Hierarchy data
 *       404:
 *         description: Hierarchy not found
 */
router.get("/:id", hierarchyController.getHierarchyById);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   put:
 *     summary: Update a hierarchy
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
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Hierarchy updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Hierarchy not found
 */
router.put(
  "/:id",
  validateUpdateHierarchy,
  hierarchyController.updateHierarchy
);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   delete:
 *     summary: Delete a hierarchy
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
 *         description: Hierarchy deleted
 *       404:
 *         description: Hierarchy not found
 */
router.delete("/:id", hierarchyController.deleteHierarchy);

module.exports = router;
