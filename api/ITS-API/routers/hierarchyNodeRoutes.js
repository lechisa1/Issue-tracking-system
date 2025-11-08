const express = require("express");
const router = express.Router();
const hierarchyNodeController = require("../controllers/hierarchyNodeController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  validateCreateHierarchyNode,
  validateHierarchyNodeId,
  validateUpdateHierarchyNode,
} = require("../validators/hierarchyNodeValidator");

/**
 * @swagger
 * components:
 *   schemas:
 *     HierarchyNode:
 *       type: object
 *       properties:
 *         hierarchy_node_id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the hierarchy node
 *         hierarchy_id:
 *           type: string
 *           format: uuid
 *           description: UUID of the hierarchy this node belongs to
 *         parent_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: UUID of the parent node (optional)
 *         name:
 *           type: string
 *           example: Department A
 *         description:
 *           type: string
 *           example: This is the department node
 *         is_active:
 *           type: boolean
 *           default: true
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
 * tags:
 *   - name: Hierarchy Nodes
 *     description: API endpoints for managing hierarchy nodes
 */

/**
 * @swagger
 * /api/hierarchy-nodes:
 *   post:
 *     summary: Create one or more hierarchy nodes (nested children supported)
 *     tags: [Hierarchy Nodes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/HierarchyNode'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/HierarchyNode'
 *     responses:
 *       201:
 *         description: Hierarchy node(s) created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  authenticateToken,
  validateCreateHierarchyNode,
  hierarchyNodeController.createHierarchyNode
);

/**
 * @swagger
 * /api/hierarchy-nodes:
 *   get:
 *     summary: Get all hierarchy nodes
 *     tags: [Hierarchy Nodes]
 *     responses:
 *       200:
 *         description: List of hierarchy nodes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HierarchyNode'
 */
router.get("/", authenticateToken, hierarchyNodeController.getHierarchyNodes);

/**
 * @swagger
 * /api/hierarchy-nodes/{id}:
 *   get:
 *     summary: Get a hierarchy node by ID
 *     tags: [Hierarchy Nodes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy node ID
 *     responses:
 *       200:
 *         description: Hierarchy node details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNode'
 *       404:
 *         description: Node not found
 */
router.get(
  "/:id",
  authenticateToken,
  validateHierarchyNodeId,
  hierarchyNodeController.getHierarchyNodeById
);

/**
 * @swagger
 * /api/hierarchy-nodes/{id}:
 *   put:
 *     summary: Update a hierarchy node by ID
 *     tags: [Hierarchy Nodes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HierarchyNode'
 *     responses:
 *       200:
 *         description: Hierarchy node updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Node not found
 */
router.put(
  "/:id",
  authenticateToken,
  validateHierarchyNodeId,
  validateUpdateHierarchyNode,
  hierarchyNodeController.updateHierarchyNode
);

/**
 * @swagger
 * /api/hierarchy-nodes/{id}:
 *   delete:
 *     summary: Delete a hierarchy node by ID
 *     tags: [Hierarchy Nodes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Hierarchy node deleted successfully
 *       404:
 *         description: Node not found
 */
router.delete(
  "/:id",
  authenticateToken,
  validateHierarchyNodeId,
  hierarchyNodeController.deleteHierarchyNode
);

module.exports = router;
