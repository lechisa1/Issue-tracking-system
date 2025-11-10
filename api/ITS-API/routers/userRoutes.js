const express = require("express");
const router = express.Router();

const {
  validateUpdateUser,
  validateCreateUser,
} = require("../validators/userValidator");
const { authenticateToken } = require("../middlewares/authMiddleware");

const {
  createUser,
  updateUser,
  getUsers,
  getUserById,
  deleteUser,
  toggleUserActiveStatus,
  resetUserPassword,
  getUserTypes,
} = require("../controllers/userController");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *         full_name:
 *           type: string
 *         email:
 *           type: string
 *         phone_number:
 *           type: string
 *         position:
 *           type: string
 *         is_active:
 *           type: boolean
 *         user_type_id:
 *           type: string
 *           format: uuid
 *         institute_id:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         assigned_by:
 *           type: string
 *           format: uuid
 *         assigned_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Register a new user (with optional role assignment)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, user_type_id]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Lechisa Bedasa"
 *               email:
 *                 type: string
 *                 example: "lechisa@example.com"
 *               user_type_id:
 *                 type: string
 *                 format: uuid
 *               institute_id:
 *                 type: string
 *                 format: uuid
 *               hierarchy_node_id :
 *                 type: string
 *                 format: uuid
 *               position:
 *                 type: string
 *                 example: "Backend Developer"
 *               phone_number:
 *                 type: string
 *                 example: "+251912345678"

 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or duplicate email
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Server error
 */
router.post("/", validateCreateUser, authenticateToken, createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve all users (with filters and pagination)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or position
 *       - in: query
 *         name: user_type_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", getUsers);
/**
 * @swagger
 * /api/users/user-types:
 *   get:
 *     summary: Get list of all user types
 *     tags:
 *       - UserTypes
 *     responses:
 *       200:
 *         description: List of user types fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User types fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_type_id:
 *                         type: string
 *                         format: uuid
 *                         example: "a1b2c3d4-5678-90ab-cdef-1234567890ab"
 *                       name:
 *                         type: string
 *                         example: external_user
 *                       description:
 *                         type: string
 *                         example: Users from external institutes
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-10T12:34:56Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-10T12:34:56Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to fetch user types
 *                 error:
 *                   type: string
 *                   example: Database connection error
 */

router.use("/user-types", getUserTypes);
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Retrieve user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/:id", authenticateToken, getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
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
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               position:
 *                 type: string
 *               user_type_id:
 *                 type: string
 *               institute_id:
 *                 type: string
 *               hierarchy_node_id :
 *                 type: string
 *
 *               is_active:
 *                 type: boolean

 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put("/:id", authenticateToken, validateUpdateUser, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Soft delete (deactivate) a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 */
router.delete("/:id", authenticateToken, deleteUser);

/**
 * @swagger
 * /api/users/{id}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
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
 *             type: object
 *             required: [is_active]
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       404:
 *         description: User not found
 */
router.patch("/:id/toggle-status", authenticateToken, toggleUserActiveStatus);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset user password and send via email
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/:id/reset-password", authenticateToken, resetUserPassword);

module.exports = router;
