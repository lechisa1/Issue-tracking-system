const { Region } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new Region
const createRegion = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if Region exists
    const existingRegion = await Region.findOne({ where: { name } });
    if (existingRegion)
      return res.status(400).json({ message: "Region with this name already exists." });

    const region_id = uuidv4();

    // Create Region
    const region = await Region.create({
      region_id,
      name,
      description,
    });

    res.status(201).json(region);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all Regions
const getRegions = async (req, res) => {
  try {
    const regions = await Region.findAll();
    res.status(200).json(regions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get Region by ID
const getRegionById = async (req, res) => {
  try {
    const { id } = req.params;
    const region = await Region.findByPk(id);
    if (!region) return res.status(404).json({ message: "Region not found" });
    res.status(200).json(region);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update Region
const updateRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const region = await Region.findByPk(id);
    if (!region) return res.status(404).json({ message: "Region not found" });

    region.name = name || region.name;
    region.description = description !== undefined ? description : region.description;

    await region.save();
    res.status(200).json(region);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete Region
const deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const region = await Region.findByPk(id);
    if (!region) return res.status(404).json({ message: "Region not found" });

    await region.destroy();
    res.status(200).json({ message: "Region deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
};
