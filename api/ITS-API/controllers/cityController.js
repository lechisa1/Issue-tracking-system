const { City } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new City
const createCity = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if City exists
    const existingCity = await City.findOne({ where: { name } });
    if (existingCity)
      return res.status(400).json({ message: "City with this name already exists." });

    const city_id = uuidv4();

    // Create City
    const city = await City.create({
      city_id,
      name,
      description,
    });

    res.status(201).json(city);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all Cities
const getCities = async (req, res) => {
  try {
    const cities = await City.findAll();
    res.status(200).json(cities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get City by ID
const getCityById = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findByPk(id);
    if (!city) return res.status(404).json({ message: "City not found" });
    res.status(200).json(city);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update City
const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const city = await City.findByPk(id);
    if (!city) return res.status(404).json({ message: "City not found" });

    city.name = name || city.name;
    city.description = description !== undefined ? description : city.description;

    await city.save();
    res.status(200).json(city);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete City
const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findByPk(id);
    if (!city) return res.status(404).json({ message: "City not found" });

    await city.destroy();
    res.status(200).json({ message: "City deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createCity,
  getCities,
  getCityById,
  updateCity,
  deleteCity,
};
