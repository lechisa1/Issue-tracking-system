const express = require("express");
const router = express.Router();
const hierarchyNodeOrganizationController = require("../controllers/hierarchyNodeOrganizationController");
const {
  validateHierarchyNodeOrganization,
  validateHierarchyNodeOrganizationId,
  handleValidationErrors,
} = require("../validators/hierarchyNodeOrganizationValidator");

/**
 * @swagger
 * components:
 *   schemas:
 *     HierarchyNodeOrganization:
 *       type: object
 *       required:
 *         - hierarchy_node_id
 *         - institute_id
 *       properties:
 *         hierarchy_node_organization_id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the hierarchy node organization association
 *         hierarchy_node_id:
 *           type: string
 *           format: uuid
 *           description: ID of the hierarchy node
 *         institute_id:
 *           type: string
 *           format: uuid
 *           description: ID of the institute
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the association is active
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         hierarchyNode:
 *           $ref: '#/components/schemas/HierarchyNode'
 *         institute:
 *           $ref: '#/components/schemas/Institute'
 */

/**
 * @swagger
 * /api/hierarchy-node-organizations:
 *   post:
 *     summary: Create a new hierarchy node organization association
 *     description: Creates an association between a hierarchy node and an institute
 *     tags: [Hierarchy Node Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hierarchy_node_id
 *               - institute_id
 *             properties:
 *               hierarchy_node_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the hierarchy node
 *               institute_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the institute
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the association is active
 *     responses:
 *       201:
 *         description: Hierarchy node organization association created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNodeOrganization'
 *       400:
 *         description: Bad request - validation error or association already exists
 *       404:
 *         description: Hierarchy node or institute not found
 *       500:
 *         description: Internal server error
 */
router.post("/", validateHierarchyNodeOrganization, handleValidationErrors, hierarchyNodeOrganizationController.createHierarchyNodeOrganization);

/**
 * @swagger
 * /api/hierarchy-node-organizations:
 *   get:
 *     summary: Get all hierarchy node organization associations
 *     description: Retrieves all associations between hierarchy nodes and institutes
 *     tags: [Hierarchy Node Organizations]
 *     responses:
 *       200:
 *         description: List of hierarchy node organization associations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HierarchyNodeOrganization'
 *       500:
 *         description: Internal server error
 */
router.get("/", hierarchyNodeOrganizationController.getHierarchyNodeOrganizations);

/**
 * @swagger
 * /api/hierarchy-node-organizations/{id}:
 *   get:
 *     summary: Get hierarchy node organization association by ID
 *     description: Retrieves a specific association by its ID
 *     tags: [Hierarchy Node Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy Node Organization Association ID
 *     responses:
 *       200:
 *         description: Hierarchy node organization association details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNodeOrganization'
 *       404:
 *         description: Association not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", validateHierarchyNodeOrganizationId, handleValidationErrors, hierarchyNodeOrganizationController.getHierarchyNodeOrganizationById);

/**
 * @swagger
 * /api/hierarchy-node-organizations/{id}:
 *   put:
 *     summary: Update hierarchy node organization association
 *     description: Updates an existing association between hierarchy node and institute
 *     tags: [Hierarchy Node Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy Node Organization Association ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hierarchy_node_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the hierarchy node
 *               institute_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the institute
 *               is_active:
 *                 type: boolean
 *                 description: Whether the association is active
 *     responses:
 *       200:
 *         description: Hierarchy node organization association updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HierarchyNodeOrganization'
 *       400:
 *         description: Bad request - validation error or duplicate association
 *       404:
 *         description: Association, hierarchy node, or institute not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", validateHierarchyNodeOrganization, handleValidationErrors, hierarchyNodeOrganizationController.updateHierarchyNodeOrganization);

/**
 * @swagger
 * /api/hierarchy-node-organizations/{id}:
 *   delete:
 *     summary: Delete hierarchy node organization association
 *     description: Deletes an association between hierarchy node and institute (soft delete)
 *     tags: [Hierarchy Node Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Hierarchy Node Organization Association ID
 *     responses:
 *       200:
 *         description: Hierarchy node organization association deleted successfully
 *       404:
 *         description: Association not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", validateHierarchyNodeOrganizationId, handleValidationErrors, hierarchyNodeOrganizationController.deleteHierarchyNodeOrganization);

module.exports = router;
