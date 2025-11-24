const { InternalNode } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create Internal Node
const createInternalNode = async (req, res) => {
  try {
    const { parent_id, name, description, is_active } = req.body;

    // Duplicate name check (global unique)
    const existing = await InternalNode.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({
        message: `Internal node with name '${name}' already exists.`,
      });
    }

    let level = 1;
    if (parent_id) {
      const parent = await InternalNode.findByPk(parent_id);
      if (!parent)
        return res.status(404).json({ message: "Parent node not found." });

      level = parent.level + 1;
    }

    const node = await InternalNode.create({
      internal_node_id: uuidv4(),
      parent_id,
      name,
      description,
      level,
      is_active,
    });

    res.status(201).json(node);
  } catch (error) {
    console.error("Error creating internal node:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get ALL nodes
const getInternalNodes = async (req, res) => {
  try {
    const nodes = await InternalNode.findAll({
      include: [
        { model: InternalNode, as: "parent" },
        { model: InternalNode, as: "children" },
      ],
      order: [["created_at", "ASC"]],
    });

    res.status(200).json(nodes);
  } catch (error) {
    console.error("Error fetching internal nodes:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get node by ID
const getInternalNodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const node = await InternalNode.findByPk(id, {
      include: [
        { model: InternalNode, as: "parent" },
        { model: InternalNode, as: "children" },
      ],
    });

    if (!node)
      return res.status(404).json({ message: "Internal node not found." });

    res.status(200).json(node);
  } catch (error) {
    console.error("Error fetching internal node:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update Internal Node
const updateInternalNode = async (req, res) => {
  try {
    const { id } = req.params;
    const { parent_id, name, description, is_active } = req.body;

    const node = await InternalNode.findByPk(id);
    if (!node)
      return res.status(404).json({ message: "Internal node not found." });

    // Validate name uniqueness
    if (name && name !== node.name) {
      const existing = await InternalNode.findOne({ where: { name } });
      if (existing) {
        return res.status(400).json({
          message: `Internal node with name '${name}' already exists.`,
        });
      }
    }

    // Update level if parent changes
    let level = node.level;
    if (parent_id !== undefined && parent_id !== node.parent_id) {
      if (parent_id) {
        const parent = await InternalNode.findByPk(parent_id);
        if (!parent)
          return res.status(404).json({ message: "Parent node not found." });

        level = parent.level + 1;
      } else {
        level = 1;
      }
    }

    node.parent_id = parent_id ?? node.parent_id;
    node.name = name ?? node.name;
    node.description = description ?? node.description;
    node.level = level;
    node.is_active = is_active ?? node.is_active;

    await node.save();
    res.status(200).json(node);
  } catch (error) {
    console.error("Error updating internal node:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete Internal Node
const deleteInternalNode = async (req, res) => {
  try {
    const { id } = req.params;

    const node = await InternalNode.findByPk(id);
    if (!node)
      return res.status(404).json({ message: "Internal node not found." });

    await node.destroy();
    res.status(200).json({ message: "Internal node deleted successfully." });
  } catch (error) {
    console.error("Error deleting internal node:", error);
    res.status(500).json({ message: error.message });
  }
};

// Build full tree
const getInternalTree = async (req, res) => {
  try {
    const allNodes = await InternalNode.findAll({
      order: [["level", "ASC"]],
    });

    const plain = allNodes.map((n) => n.get({ plain: true }));
    const map = new Map();

    plain.forEach((node) =>
      map.set(node.internal_node_id, { ...node, children: [] })
    );

    const roots = [];

    map.forEach((node) => {
      if (node.parent_id) {
        const parent = map.get(node.parent_id);
        if (parent) parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    res.status(200).json({
      success: true,
      count: roots.length,
      nodes: roots,
    });
  } catch (error) {
    console.error("Error building internal tree:", error);
    res.status(500).json({ message: error.message });
  }
};
// Get top-level (parent) internal nodes
const getParentInternalNodes = async (req, res) => {
  try {
    const parents = await InternalNode.findAll({
      where: { parent_id: null },
      include: [{ model: InternalNode, as: "children" }],
      order: [["created_at", "ASC"]],
    });

    res.status(200).json({
      success: true,
      count: parents.length,
      nodes: parents,
    });
  } catch (error) {
    console.error("Error fetching parent internal nodes:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createInternalNode,
  getInternalNodes,
  getInternalNodeById,
  updateInternalNode,
  deleteInternalNode,
  getInternalTree,
  getParentInternalNodes,
};
