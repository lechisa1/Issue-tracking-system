const { Sub_city } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new Sub_city
const createSub_city = async (req, res) => {
  try {
    const { name, city_id, description } = req.body;

    // Check if Sub_city exists
    const existingSub_city = await Sub_city.findOne({ where: { name } });
    if (existingSub_city)
      return res.status(400).json({ message: "Sub_city with this name already exists." });

    const sub_city_id = uuidv4();

    // Create Sub_city
    const sub_city = await Sub_city.create({
      sub_city_id,
      name,
      city_id,
      description,
    });

    res.status(201).json(sub_city);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all Sub_citys
const getSub_citys = async (req, res) => {
  try {
    const sub_citys = await Sub_city.findAll({
      include: [
        {
          model: require("../models").City,
          as: "city",
        },
        {
          model: require("../models").Woreda,
          as: "woredas",
        },
      ],
    });
    res.status(200).json(sub_citys);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get Sub_city by ID
const getSub_cityById = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_city = await Sub_city.findByPk(id, {
      include: [
        {
          model: require("../models").City,
          as: "city",
        },
        {
          model: require("../models").Woreda,
          as: "woredas",
        },
      ],
    });
    if (!sub_city) return res.status(404).json({ message: "Sub_city not found" });
    res.status(200).json(sub_city);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update Sub_city
const updateSub_city = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city_id, description } = req.body;

    const sub_city = await Sub_city.findByPk(id);
    if (!sub_city) return res.status(404).json({ message: "Sub_city not found" });

    sub_city.name = name || sub_city.name;
    sub_city.city_id = city_id || sub_city.city_id;
    sub_city.description = description !== undefined ? description : sub_city.description;

    await sub_city.save();
    res.status(200).json(sub_city);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete Sub_city
const deleteSub_city = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_city = await Sub_city.findByPk(id);
    if (!sub_city) return res.status(404).json({ message: "Sub_city not found" });

    await sub_city.destroy();
    res.status(200).json({ message: "Sub_city deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createSub_city,
  getSub_citys,
  getSub_cityById,
  updateSub_city,
  deleteSub_city,
};
