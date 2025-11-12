const { HierarchyNode, Project } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a hierarchy node (no recursion, single creation)
const createHierarchyNode = async (req, res) => {
  try {
    const { project_id, parent_id, name, description, is_active } = req.body;

    // Validate project existence
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res
        .status(404)
        .json({ message: `Project with id '${project_id}' not found.` });
    }

    // Check for duplicate name within the same project
    const existingNode = await HierarchyNode.findOne({
      where: { name, project_id },
    });
    if (existingNode) {
      return res.status(400).json({
        message: `Hierarchy node with name '${name}' already exists in this project.`,
      });
    }

    // Determine level based on parent
    let level = 1;
    if (parent_id) {
      const parentNode = await HierarchyNode.findByPk(parent_id);
      if (!parentNode)
        return res.status(404).json({ message: "Parent node not found." });

      if (parentNode.project_id !== project_id) {
        return res
          .status(400)
          .json({ message: "Parent node must belong to the same project." });
      }

      level = parentNode.level + 1;
    }

    // Create node
    const hierarchy_node_id = uuidv4();
    const node = await HierarchyNode.create({
      hierarchy_node_id,
      project_id,
      parent_id,
      name,
      description,
      level,
      is_active,
    });

    return res.status(201).json(node);
  } catch (error) {
    console.error("Error creating hierarchy node:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all hierarchy nodes
const getHierarchyNodes = async (req, res) => {
  try {
    const nodes = await HierarchyNode.findAll({
      include: [
        { model: Project, as: "project" },
        { model: HierarchyNode, as: "parent" },
        { model: HierarchyNode, as: "children" },
      ],
    });
    res.status(200).json(nodes);
  } catch (error) {
    console.error("Error fetching hierarchy nodes:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get hierarchy node by ID
const getHierarchyNodeById = async (req, res) => {
  try {
    const { id } = req.params;
    const node = await HierarchyNode.findByPk(id, {
      include: [
        { model: Project, as: "project" },
        { model: HierarchyNode, as: "parent" },
        { model: HierarchyNode, as: "children" },
      ],
    });

    if (!node)
      return res.status(404).json({ message: "Hierarchy node not found." });

    res.status(200).json(node);
  } catch (error) {
    console.error("Error fetching hierarchy node:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update hierarchy node
const updateHierarchyNode = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, parent_id, name, description, is_active } = req.body;

    const node = await HierarchyNode.findByPk(id);
    if (!node)
      return res.status(404).json({ message: "Hierarchy node not found." });

    // Check for duplicate name within the same project
    if (name && name !== node.name) {
      const existingNode = await HierarchyNode.findOne({
        where: { name, project_id: project_id || node.project_id },
      });
      if (existingNode) {
        return res.status(400).json({
          message: `Hierarchy node with name '${name}' already exists in this project.`,
        });
      }
    }

    // Determine new level if parent_id changes
    let level = node.level;
    if (parent_id !== undefined && parent_id !== node.parent_id) {
      if (parent_id) {
        const parentNode = await HierarchyNode.findByPk(parent_id);
        if (!parentNode)
          return res.status(404).json({ message: "Parent node not found." });

        if (parentNode.project_id !== (project_id || node.project_id)) {
          return res.status(400).json({
            message: "Parent node must belong to the same project.",
          });
        }

        level = parentNode.level + 1;
      } else {
        level = 1;
      }
    }

    node.project_id = project_id || node.project_id;
    node.parent_id = parent_id !== undefined ? parent_id : node.parent_id;
    node.name = name || node.name;
    node.description = description || node.description;
    node.level = level;
    if (is_active !== undefined) node.is_active = is_active;

    await node.save();
    res.status(200).json(node);
  } catch (error) {
    console.error("Error updating hierarchy node:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete hierarchy node
const deleteHierarchyNode = async (req, res) => {
  try {
    const { id } = req.params;
    const node = await HierarchyNode.findByPk(id);
    if (!node)
      return res.status(404).json({ message: "Hierarchy node not found." });

    await node.destroy();
    res.status(200).json({ message: "Hierarchy node deleted successfully." });
  } catch (error) {
    console.error("Error deleting hierarchy node:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get top-level hierarchy nodes (parent_id = null) for a specific project
const getParentNodes = async (req, res) => {
  try {
    const { project_id } = req.params;

    // Validate project existence
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res
        .status(404)
        .json({ message: `Project with id '${project_id}' not found.` });
    }

    // Fetch top-level nodes
    const parentNodes = await HierarchyNode.findAll({
      where: { project_id, parent_id: null },
      include: [
        { model: Project, as: "project" },
        { model: HierarchyNode, as: "children" },
      ],
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      project_id,
      count: parentNodes.length,
      parentNodes,
    });
  } catch (error) {
    console.error("Error fetching parent nodes:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createHierarchyNode,
  getHierarchyNodes,
  getHierarchyNodeById,
  updateHierarchyNode,
  deleteHierarchyNode,
  getParentNodes,
};
