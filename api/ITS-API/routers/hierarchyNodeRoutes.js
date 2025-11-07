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
 *           description: Unique identifier for the hierarchy node
 *         hierarchy_id:
 *           type: string
 *           format: uuid
 *           description: ID of the hierarchy this node belongs to
 *         parent_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the parent node (null for root nodes)
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Name of the hierarchy node
 *         description:
 *           type: string
 *           description: Description of the hierarchy node
 *         level:
 *           type: integer
 *           default: 1
 *           description: Level of the hierarchy node (1 for root, 2 for children, etc.)
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the hierarchy node is active
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         deleted_at:
 */

/**
 * @swagger
 * /api/hierarchy-nodes:
 *   post:
 *     summary: Create a new hierarchy node
 *     description: Creates a new node in the hierarchy structure (supports dynamic depth)
 *     tags: [Hierarchy Nodes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - hierarchy_id
 *                   - name
 *                   properties:
 *                     hierarchy_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the hierarchy this node belongs to
 *                     name:
 *                       type: string
 *                       maxLength: 255
 *                       description: Name of the hierarchy node
 *                     description:
 *                       type: string
 *                       description: Description of the hierarchy node
 *                     is_active:
 *                       type: boolean
 *                       default: true
 *                       description: Whether the hierarchy node is active
 *                     children:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - hierarchy_id
 *                           - name
 *                         properties:
 *                           hierarchy_id:
 *                             type: string
 *                             format: uuid
 *                             description: ID of the hierarchy this node belongs to
 *                           name:
 *                             type: string
 *                             maxLength: 255
 *                             description: Name of the hierarchy node
 *                           description:
 *                             type: string
 *                             description: Description of the hierarchy node
 *                           is_active:
 *                             type: boolean
 *                             default: true
 *                             description: Whether the hierarchy node is active
 *                           children:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/HierarchyNode'
 *                             description: Nested children nodes (recursive structure)
 *                       description: Nested children nodes (recursive structure)
 *               - type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - hierarchy_id
 *                     - name
 *                   properties:
 *                     hierarchy_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the hierarchy this node belongs to
 *                     name:
 *                       type: string
 *                       maxLength: 255
 *                       description: Name of the hierarchy node
 *                     description:
 *                       type: string
 *                       description: Description of the hierarchy node
 *                     is_active:
 *                       type: boolean
 *                       default: true
 *                       description: Whether the hierarchy node is active
 *                     children:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HierarchyNode'
 *                       description: Nested children nodes (recursive structure)
 *     responses:
 *       201:
 *         description: Hierarchy node created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNode'
 *       400:
 *         description: Bad request - validation error or node already exists
 *       404:
 *         description: Hierarchy or parent node not found
 *       500:
 *         description: Internal server error
 */
router.post("/", validateHierarchyNode, handleValidationErrors, hierarchyNodeController.createHierarchyNode);

/**
 * @swagger
 * /api/hierarchy-nodes:
 *   get:
 *     summary: Get all hierarchy nodes
 *     description: Retrieves all hierarchy nodes with their hierarchical structure
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
 *       500:
 *         description: Internal server error
 */
router.get("/", hierarchyNodeController.getHierarchyNodes);

/**
 * @swagger
 * /api/hierarchy-nodes/{id}:
 *   get:
 *     summary: Get hierarchy node by ID
 *     description: Retrieves a specific hierarchy node by its ID
 *     tags: [Hierarchy Nodes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy Node ID
 *     responses:
 *       200:
 *         description: Hierarchy node details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNode'
 *       404:
 *         description: Hierarchy node not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", validateHierarchyNodeId, handleValidationErrors, hierarchyNodeController.getHierarchyNodeById);

/**
 * @swagger
 * /api/hierarchy-nodes/{id}:
 *   put:
 *     summary: Update hierarchy node
 *     description: Updates an existing hierarchy node
 *     tags: [Hierarchy Nodes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy Node ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hierarchy_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the hierarchy this node belongs to
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID of the parent node (null for root nodes)
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Name of the hierarchy node
 *               description:
 *                 type: string
 *                 description: Description of the hierarchy node
 *               is_active:
 *                 type: boolean
 *                 description: Whether the hierarchy node is active
 *     responses:
 *       200:
 *         description: Hierarchy node updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNode'
 *       404:
 *         description: Hierarchy node not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", validateHierarchyNode, handleValidationErrors, hierarchyNodeController.updateHierarchyNode);

/**
 * @swagger
 * /api/hierarchy-nodes/{id}:
 *   delete:
 *     summary: Delete hierarchy node
 *     description: Deletes a hierarchy node (soft delete)
 *     tags: [Hierarchy Nodes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy Node ID
 *     responses:
 *       200:
 *         description: Hierarchy node deleted successfully
 *       404:
 *         description: Hierarchy node not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", validateHierarchyNodeId, handleValidationErrors, hierarchyNodeController.deleteHierarchyNode);

module.exports = router;
