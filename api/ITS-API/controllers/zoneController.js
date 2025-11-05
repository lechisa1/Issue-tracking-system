const { Zone } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new Zone
const createZone = async (req, res) => {
  try {
    const { name, region_id, description } = req.body;

    // Check if Zone exists
    const existingZone = await Zone.findOne({ where: { name } });
    if (existingZone)
      return res.status(400).json({ message: "Zone with this name already exists." });

    const zone_id = uuidv4();

    // Create Zone
    const zone = await Zone.create({
      zone_id,
      name,
      region_id,
      description,
    });

    res.status(201).json(zone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all Zones
const getZones = async (req, res) => {
  try {
    const zones = await Zone.findAll({
      include: [
        {
          model: require("../models").Region,
          as: "region",
        },
        {
          model: require("../models").Woreda,
          as: "woredas",
        },
      ],
    });
    res.status(200).json(zones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get Zone by ID
const getZoneById = async (req, res) => {
  try {
    const { id } = req.params;
    const zone = await Zone.findByPk(id, {
      include: [
        {
          model: require("../models").Region,
          as: "region",
        },
        {
          model: require("../models").Woreda,
          as: "woredas",
        },
      ],
    });
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    res.status(200).json(zone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update Zone
const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region_id, description } = req.body;

    const zone = await Zone.findByPk(id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    zone.name = name || zone.name;
    zone.region_id = region_id || zone.region_id;
    zone.description = description !== undefined ? description : zone.description;

    await zone.save();
    res.status(200).json(zone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete Zone
const deleteZone = async (req, res) => {
  try {
    const { id } = req.params;
    const zone = await Zone.findByPk(id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    await zone.destroy();
    res.status(200).json({ message: "Zone deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createZone,
  getZones,
  getZoneById,
  updateZone,
  deleteZone,
};
