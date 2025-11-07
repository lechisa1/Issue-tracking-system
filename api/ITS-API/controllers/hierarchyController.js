const { Hierarchy, Project } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new Hierarchy
const createHierarchy = async (req, res) => {
  try {
    const { name, project_id, description } = req.body;

    // Check if Hierarchy exists
    const existingHierarchy = await Hierarchy.findOne({ where: { name } });
    if (existingHierarchy)
      return res
        .status(400)
        .json({ message: "Hierarchy with this name already exists." });

    const hierarchy_id = uuidv4();

    // Create Hierarchy
    const hierarchy = await Hierarchy.create({
      hierarchy_id,
      name,
      project_id,
      description,
    });

    res.status(201).json(hierarchy);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all Hierarchies
const getHierarchies = async (req, res) => {
  try {
    const hierarchies = await Hierarchy.findAll({
      include: [
        {
          model: Project,
          as: "project",
        },
      ],
    });
    res.status(200).json(hierarchies);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get Hierarchy by ID
const getHierarchyById = async (req, res) => {
  try {
    const { id } = req.params;
    const hierarchy = await Hierarchy.findByPk(id, {
      include: [
        {
          model: Project,
          as: "project",
        },
      ],
    });
    if (!hierarchy)
      return res.status(404).json({ message: "Hierarchy not found" });
    res.status(200).json(hierarchy);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update Hierarchy
const updateHierarchy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, project_id, description, is_active } = req.body;

    const hierarchy = await Hierarchy.findByPk(id);
    if (!hierarchy)
      return res.status(404).json({ message: "Hierarchy not found" });

    hierarchy.name = name || hierarchy.name;
    hierarchy.project_id = project_id || hierarchy.project_id;
    hierarchy.description =
      description !== undefined ? description : hierarchy.description;
    hierarchy.is_active =
      is_active !== undefined ? is_active : hierarchy.is_active;

    await hierarchy.save();
    res.status(200).json(hierarchy);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete Hierarchy (soft delete)
const deleteHierarchy = async (req, res) => {
  try {
    const { id } = req.params;
    const hierarchy = await Hierarchy.findByPk(id);
    if (!hierarchy)
      return res.status(404).json({ message: "Hierarchy not found" });

    await hierarchy.destroy();
    res.status(200).json({ message: "Hierarchy deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createHierarchy,
  getHierarchies,
  getHierarchyById,
  updateHierarchy,
  deleteHierarchy,
};
