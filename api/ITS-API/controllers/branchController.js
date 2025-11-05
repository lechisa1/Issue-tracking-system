const { Branch } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new Branch
const createBranch = async (req, res) => {
  try {
    const { name, region_id, city_id,organization_id, sub_city_id, woreda_id, description } = req.body;

    // Check if Branch exists
    const existingBranch = await Branch.findOne({ where: { name } });
    if (existingBranch)
      return res.status(400).json({ message: "Branch with this name already exists." });

    const branch_id = uuidv4();

    // Create Branch
    const branch = await Branch.create({
      branch_id,
      name,
      region_id,
      city_id,
      organization_id,
      sub_city_id,
      woreda_id,
      description,
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all Branches
const getBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      include: [
        {
          model: require("../models").Region,
          as: "region",
        },
        {
          model: require("../models").City,
          as: "city",
        },
        {
          model: require("../models").Sub_city,
          as: "sub_city",
        },
        {
          model: require("../models").Woreda,
          as: "woreda",
        },
      ],
    });
    res.status(200).json(branches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get Branch by ID
const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id, {
      include: [
        {
          model: require("../models").Region,
          as: "region",
        },
        {
          model: require("../models").City,
          as: "city",
        },
        {
          model: require("../models").Sub_city,
          as: "sub_city",
        },
        {
          model: require("../models").Woreda,
          as: "woreda",
        },
      ],
    });
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.status(200).json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update Branch
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region_id, city_id, sub_city_id, woreda_id, description } = req.body;

    const branch = await Branch.findByPk(id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    branch.name = name || branch.name;
    branch.region_id = region_id || branch.region_id;
    branch.city_id = city_id || branch.city_id;
    branch.sub_city_id = sub_city_id || branch.sub_city_id;
    branch.woreda_id = woreda_id || branch.woreda_id;
    branch.description = description !== undefined ? description : branch.description;

    await branch.save();
    res.status(200).json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete Branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    await branch.destroy();
    res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};
