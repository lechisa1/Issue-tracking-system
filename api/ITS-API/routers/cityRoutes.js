/**
 * @swagger
 * components:
 *   schemas:
 *     City:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID of the city
 *         name:
 *           type: string
 *           description: The name of the city
 *         region:
 *           type: string
 *           description: The region where the city is located
 *         branch_id:
 *           type: integer
 *           description: Associated branch ID (if applicable)
 *       example:
 *         id: 1
 *         name: Addis Ababa
 *         region: Oromia
 *         branch_id: 2
 */

/**
 * @swagger
 * tags:
 *   name: Cities
 *   description: City management API
 */

/**
 * @swagger
 * /cities:
 *   post:
 *     summary: Create a new city
 *     tags: [Cities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/City'
 *     responses:
 *       201:
 *         description: City created successfully
 *       400:
 *         description: Invalid input
 *
 *   get:
 *     summary: Get all cities
 *     tags: [Cities]
 *     responses:
 *       200:
 *         description: List of all cities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/City'
 */

/**
 * @swagger
 * /cities/{id}:
 *   get:
 *     summary: Get a city by ID
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: City ID
 *     responses:
 *       200:
 *         description: City found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/City'
 *       404:
 *         description: City not found
 *
 *   put:
 *     summary: Update an existing city
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: City ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/City'
 *     responses:
 *       200:
 *         description: City updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: City not found
 *
 *   delete:
 *     summary: Delete a city by ID
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: City ID
 *     responses:
 *       200:
 *         description: City deleted successfully
 *       404:
 *         description: City not found
 */

const express = require("express");
const router = express.Router();
const CityController = require("../controllers/cityController");
const {
  validateCreateCity,
  validateUpdateCity,
} = require("../validators/cityValidator");

//  endpoints for Cities
router.post("/", validateCreateCity, CityController.createCity);
router.get("/", CityController.getCities);
router.get("/:id", CityController.getCityById);
router.put("/:id", validateUpdateCity, CityController.updateCity);
router.delete("/:id", CityController.deleteCity);

module.exports = router;
