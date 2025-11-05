const { Woreda } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new Woreda
const createWoreda = async (req, res) => {
  try {
    const { name, zone_id, sub_city_id, description } = req.body;

    // Check if Woreda exists
    const existingWoreda = await Woreda.findOne({ where: { name } });
    if (existingWoreda)
      return res.status(400).json({ message: "Woreda with this name already exists." });

    const woreda_id = uuidv4();

    // Create Woreda
    const woreda = await Woreda.create({
      woreda_id,
      name,
      zone_id,
      sub_city_id,
      description,
    });

    res.status(201).json(woreda);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all Woredas
const getWoredas = async (req, res) => {
  try {
    const woredas = await Woreda.findAll({
      include: [
        {
          model: require("../models").Sub_city,
          as: "sub_city",
          include: [
            {
              model: require("../models").City,
              as: "city",
            },
          ],
        },
        {
          model: require("../models").Zone,
          as: "zone",
          include: [
            {
              model: require("../models").Region,
              as: "region",
            },
          ],
        },
      ],
    });
    res.status(200).json(woredas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get Woreda by ID
const getWoredaById = async (req, res) => {
  try {
    const { id } = req.params;
    const woreda = await Woreda.findByPk(id, {
      include: [
        {
          model: require("../models").Sub_city,
          as: "sub_city",
          include: [
            {
              model: require("../models").City,
              as: "city",
            },
          ],
        },
        {
          model: require("../models").Zone,
          as: "zone",
          include: [
            {
              model: require("../models").Region,
              as: "region",
            },
          ],
        },
      ],
    });
    if (!woreda) return res.status(404).json({ message: "Woreda not found" });
    res.status(200).json(woreda);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update Woreda
const updateWoreda = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, zone_id, sub_city_id, description } = req.body;

    const woreda = await Woreda.findByPk(id);
    if (!woreda) return res.status(404).json({ message: "Woreda not found" });

    woreda.name = name || woreda.name;
    woreda.zone_id = zone_id !== undefined ? zone_id : woreda.zone_id;
    woreda.sub_city_id = sub_city_id !== undefined ? sub_city_id : woreda.sub_city_id;
    woreda.description = description !== undefined ? description : woreda.description;

    await woreda.save();
    res.status(200).json(woreda);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete Woreda
const deleteWoreda = async (req, res) => {
  try {
    const { id } = req.params;
    const woreda = await Woreda.findByPk(id);
    if (!woreda) return res.status(404).json({ message: "Woreda not found" });

    await woreda.destroy();
    res.status(200).json({ message: "Woreda deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createWoreda,
  getWoredas,
  getWoredaById,
  updateWoreda,
  deleteWoreda,
};
