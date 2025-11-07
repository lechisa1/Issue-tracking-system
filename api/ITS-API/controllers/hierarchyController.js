const { Hierarchy, Project, HierarchyNode } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new hierarchy or multiple hierarchies
const createHierarchy = async (req, res) => {
  try {
    const input = req.body;

    // Check if input is an array (multiple hierarchies) or single object
    if (Array.isArray(input)) {
      // Handle multiple hierarchies
      const createdHierarchies = [];
      for (const hierarchyData of input) {
        const { name, project_id, parent_id, description, is_active } = hierarchyData;

        // Check if hierarchy exists
        const existingHierarchy = await Hierarchy.findOne({ where: { name } });
        if (existingHierarchy) {
          return res.status(400).json({ message: `Hierarchy with name '${name}' already exists.` });
        }

        const hierarchy_id = uuidv4();

        // Create hierarchy
        const hierarchy = await Hierarchy.create({
          hierarchy_id,
          name,
          project_id,
          parent_id,
          description,
          is_active,
        });

        createdHierarchies.push(hierarchy);
      }

      res.status(201).json(createdHierarchies);
    } else {
      // Handle single hierarchy
      const { name, project_id, parent_id, description,  is_active } = input;

      // Check if hierarchy exists
      const existingHierarchy = await Hierarchy.findOne({ where: { name } });
      if (existingHierarchy)
        return res.status(400).json({ message: "Hierarchy with this name already exists." });

      const hierarchy_id = uuidv4();

      // Create hierarchy
      const hierarchy = await Hierarchy.create({
        hierarchy_id,
        name,
        project_id,
        parent_id,
        description,
        is_active,
      });

      res.status(201).json(hierarchy);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all hierarchies
const getHierarchies = async (req, res) => {
  try {
    const hierarchies = await Hierarchy.findAll({
      include: [
        { model: Project, as: "project" },
        { model: HierarchyNode, as: "nodes" },
      ],
    });
    res.status(200).json(hierarchies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get hierarchy by ID
const getHierarchyById = async (req, res) => {
  try {
    const { id } = req.params;
    const hierarchy = await Hierarchy.findByPk(id, {
      include: [
        { model: Project, as: "project" },
        { model: HierarchyNode, as: "nodes" },
      ],
    });
    if (!hierarchy) return res.status(404).json({ message: "Hierarchy not found" });
    res.status(200).json(hierarchy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update hierarchy
const updateHierarchy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, project_id, parent_id, description , is_active } = req.body;

    const hierarchy = await Hierarchy.findByPk(id);
    if (!hierarchy) return res.status(404).json({ message: "Hierarchy not found" });

    hierarchy.name = name || hierarchy.name;
    hierarchy.project_id = project_id || hierarchy.project_id;
    hierarchy.parent_id = parent_id !== undefined ? parent_id : hierarchy.parent_id;
    hierarchy.description = description || hierarchy.description;
    if (is_active !== undefined) hierarchy.is_active = is_active;

    await hierarchy.save();
    res.status(200).json(hierarchy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete hierarchy
const deleteHierarchy = async (req, res) => {
  try {
    const { id } = req.params;
    const hierarchy = await Hierarchy.findByPk(id);
    if (!hierarchy) return res.status(404).json({ message: "Hierarchy not found" });

    await hierarchy.destroy();
    res.status(200).json({ message: "Hierarchy deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createHierarchy,
  getHierarchies,
  getHierarchyById,
  updateHierarchy,
  deleteHierarchy,
};
