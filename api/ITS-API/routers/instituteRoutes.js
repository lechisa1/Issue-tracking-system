const express = require("express");
const router = express.Router();
const instituteController = require("../controllers/instituteController");
const {
  validateInstitute,
  validateInstituteId,
  handleValidationErrors,
} = require("../validators/instituteValidator");

/**
 * @swagger
 * components:
 *   schemas:
 *     Institute:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         institute_id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the institute
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Name of the institute
 *         description:
 *           type: string
 *           description: Description of the institute
 *         has_branch:
 *           type: boolean
 *           default: false
 *           description: Whether the institute has branches
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the institute is active
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
 * /api/institutes:
 *   post:
 *     summary: Create a new institute
 *     description: Creates a new institute (organization)
 *     tags: [Institutes]
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
 *                 description: Name of the institute
 *               description:
 *                 type: string
 *                 description: Description of the institute
 *               has_branch:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the institute has branches
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the institute is active
 *     responses:
 *       201:
 *         description: Institute created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institute'
 *       400:
 *         description: Bad request - validation error or institute already exists
 *       500:
 *         description: Internal server error
 */
router.post("/", validateInstitute, handleValidationErrors, instituteController.createInstitute);

/**
 * @swagger
 * /api/institutes:
 *   get:
 *     summary: Get all institutes
 *     description: Retrieves all institutes with their associated projects. Supports filtering by has_branch and is_active status.
 *     tags: [Institutes]
 *     parameters:
 *       - in: query
 *         name: has_branch
 *         schema:
 *           type: boolean
 *         description: Filter institutes by branch status (true/false)
 *         example: true
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter institutes by active status (true/false)
 *         example: true
 *     responses:
 *       200:
 *         description: List of institutes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Institute'
 *       500:
 *         description: Internal server error
 */
router.get("/", instituteController.getInstitutes);

/**
 * @swagger
 * /api/institutes/{id}:
 *   get:
 *     summary: Get institute by ID
 *     description: Retrieves a specific institute by its ID
 *     tags: [Institutes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Institute ID
 *     responses:
 *       200:
 *         description: Institute details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institute'
 *       404:
 *         description: Institute not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", validateInstituteId, handleValidationErrors, instituteController.getInstituteById);

/**
 * @swagger
 * /api/institutes/{id}:
 *   put:
 *     summary: Update institute
 *     description: Updates an existing institute
 *     tags: [Institutes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Institute ID
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
 *                 description: Name of the institute
 *               description:
 *                 type: string
 *                 description: Description of the institute
 *               has_branch:
 *                 type: boolean
 *                 description: Whether the institute has branches
 *               is_active:
 *                 type: boolean
 *                 description: Whether the institute is active
 *     responses:
 *       200:
 *         description: Institute updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institute'
 *       404:
 *         description: Institute not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", validateInstitute, handleValidationErrors, instituteController.updateInstitute);

/**
 * @swagger
 * /api/institutes/{id}:
 *   delete:
 *     summary: Delete institute
 *     description: Deletes an institute (soft delete)
 *     tags: [Institutes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Institute ID
 *     responses:
 *       200:
 *         description: Institute deleted successfully
 *       404:
 *         description: Institute not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", validateInstituteId, handleValidationErrors, instituteController.deleteInstitute);

module.exports = router;
