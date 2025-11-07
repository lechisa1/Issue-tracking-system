const express = require("express");
const router = express.Router();
const hierarchyNodeController = require("../controllers/hierarchyNodeController");
const {
  validateHierarchyNode,
  validateHierarchyNodeId,
  handleValidationErrors,
} = require("../validators/hierarchyNodeValidator");

/**
 * @swagger
 * components:
 *   schemas:
 *     HierarchyNode:
 *       type: object
 *       required:
 *         - hierarchy_id
 *         - name
 *       properties:
 *         hierarchy_node_id:
 *           type: string
 *           format: uuid
 *         hierarchy_id:
 *           type: string
 *           format: uuid
 *         parent_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         name:
 *           type: string
 *           maxLength: 255
 *         description:
 *           type: string       
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
 * /api/hierarchy-nodes:
 *   post:
 *     summary: Create a new hierarchy node
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
 *         description: Created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNode'
 */
router.post("/", validateHierarchyNode, handleValidationErrors, hierarchyNodeController.createHierarchyNode);

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
router.get("/", hierarchyNodeController.getHierarchyNodes);

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
 *     responses:
 *       200:
 *         description: Node details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNode'
 */
router.get("/:id", validateHierarchyNodeId, handleValidationErrors, hierarchyNodeController.getHierarchyNodeById);

/**
 * @swagger
 * /api/hierarchy-nodes/{id}:
 *   put:
 *     summary: Update a hierarchy node
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
 *         description: Updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNode'
 */
router.put("/:id", validateHierarchyNode, handleValidationErrors, hierarchyNodeController.updateHierarchyNode);

/**
 * @swagger
 * /api/hierarchy-nodes/{id}:
 *   delete:
 *     summary: Delete a hierarchy node
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
 *         description: Deleted successfully
 */
router.delete("/:id", validateHierarchyNodeId, handleValidationErrors, hierarchyNodeController.deleteHierarchyNode);

module.exports = router;
