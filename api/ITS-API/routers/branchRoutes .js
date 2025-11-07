/**
 * @swagger
 * components:
 *   schemas:
 *     Branch:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the branch
 *         name:
 *           type: string
 *           description: The name of the branch
 *         location:
 *           type: string
 *           description: The branch location
 *       example:
 *         id: 1
 *         name: Main Branch
 *         location: Addis Ababa
 */

/**
 * @swagger
 * tags:
 *   name: Branches
 *   description: Branch management API
 */

/**
 * @swagger
 * /branches:
 *   post:
 *     summary: Create a new branch
 *     tags: [Branches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Branch'
 *     responses:
 *       201:
 *         description: Branch created successfully
 *       400:
 *         description: Invalid input
 *
 *   get:
 *     summary: Get all branches
 *     tags: [Branches]
 *     responses:
 *       200:
 *         description: List of branches
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Branch'
 */

/**
 * @swagger
 * /branches/{id}:
 *   get:
 *     summary: Get a branch by ID
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch found
 *       404:
 *         description: Branch not found
 *
 *   put:
 *     summary: Update a branch
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Branch'
 *     responses:
 *       200:
 *         description: Branch updated successfully
 *
 *   delete:
 *     summary: Delete a branch
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Branch deleted successfully
 */

const express = require("express");
const router = express.Router();
const BranchController = require("../controllers/branchController");
const {
  validateCreateBranch,
  validateUpdateBranch,
} = require("../validators/branchValidator");

//  endpoints for Branches
router.post("/", validateCreateBranch, BranchController.createBranch);
router.get("/", BranchController.getBranches);
router.get("/:id", BranchController.getBranchById);
router.put("/:id", validateUpdateBranch, BranchController.updateBranch);
router.delete("/:id", BranchController.deleteBranch);

module.exports = router;
