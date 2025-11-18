const { Institute, Project } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new institute
const createInstitute = async (req, res) => {
  try {
    const { name, description, is_active } = req.body;

    // Check if institute exists
    const existingInstitute = await Institute.findOne({ where: { name } });
    if (existingInstitute)
      return res
        .status(400)
        .json({ message: "Institute with this name already exists." });

    const institute_id = uuidv4();

    // Create institute
    const institute = await Institute.create({
      institute_id,
      name,
      description,
      is_active,
    });

    res.status(201).json(institute);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all institutes
const getInstitutes = async (req, res) => {
  try {
    const { is_active } = req.query;

    // Build where clause for filtering
    const whereClause = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active === "true";
    }

    const institutes = await Institute.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: "projects",
          through: { attributes: ["is_active"] },
        },
      ],
    });
    res.status(200).json(institutes);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get institute by ID
const getInstituteById = async (req, res) => {
  try {
    const { id } = req.params;
    const institute = await Institute.findByPk(id, {
      include: [
        {
          model: Project,
          as: "projects",
          through: { attributes: ["is_active"] },
        },
      ],
    });
    if (!institute)
      return res.status(404).json({ message: "Institute not found" });
    res.status(200).json(institute);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update institute
const updateInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const institute = await Institute.findByPk(id);
    if (!institute)
      return res.status(404).json({ message: "Institute not found" });

    institute.name = name || institute.name;
    institute.description = description || institute.description;
    if (is_active !== undefined) institute.is_active = is_active;

    await institute.save();
    res.status(200).json(institute);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete institute
const deleteInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    const institute = await Institute.findByPk(id);
    if (!institute)
      return res.status(404).json({ message: "Institute not found" });

    await institute.destroy();
    res.status(200).json({ message: "Institute deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createInstitute,
  getInstitutes,
  getInstituteById,
  updateInstitute,
  deleteInstitute,
};
