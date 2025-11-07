const { HierarchyNode, Hierarchy } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Recursive function to create hierarchy nodes from nested structure
const createNodeRecursive = async (nodeData, hierarchy_id, parent_id = null) => {
  const { name, description, is_active = true, children } = nodeData;

  // Check if node exists
  const existingNode = await HierarchyNode.findOne({ where: { name } });
  if (existingNode) {
    throw new Error(`Hierarchy node with name '${name}' already exists.`);
  }

  const hierarchy_node_id = uuidv4();

  // Create node
  const node = await HierarchyNode.create({
    hierarchy_node_id,
    hierarchy_id,
    parent_id,
    name,
    description,
    is_active,
  });

  const createdNodes = [node];

  // Recursively create children
  if (children && Array.isArray(children)) {
    for (const child of children) {
      const childNodes = await createNodeRecursive(child, hierarchy_id, hierarchy_node_id, );
      createdNodes.push(...childNodes);
    }
  }

  return createdNodes;
};

// Create hierarchy node(s)
const createHierarchyNode = async (req, res) => {
  try {
    const input = req.body;

    if (Array.isArray(input)) {
      // Multiple root nodes
      const allCreatedNodes = [];
      for (const rootNode of input) {
        if (!rootNode.hierarchy_id) throw new Error("hierarchy_id is required");
        const createdNodes = await createNodeRecursive(rootNode, rootNode.hierarchy_id);
        allCreatedNodes.push(...createdNodes);
      }
      return res.status(201).json(allCreatedNodes);
    } else {
      // Single root node
      if (!input.hierarchy_id) throw new Error("hierarchy_id is required");
      const createdNodes = await createNodeRecursive(input, input.hierarchy_id);
      return res.status(201).json(createdNodes);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all hierarchy nodes
const getHierarchyNodes = async (req, res) => {
  try {
    const nodes = await HierarchyNode.findAll({
      include: [
        { model: Hierarchy, as: "hierarchy" },
        { model: HierarchyNode, as: "parent" },
        { model: HierarchyNode, as: "children" },
      ],
    });
    res.status(200).json(nodes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get node by ID
const getHierarchyNodeById = async (req, res) => {
  try {
    const { id } = req.params;
    const node = await HierarchyNode.findByPk(id, {
      include: [
        { model: Hierarchy, as: "hierarchy" },
        { model: HierarchyNode, as: "parent" },
        { model: HierarchyNode, as: "children" },
      ],
    });
    if (!node) return res.status(404).json({ message: "Hierarchy node not found" });
    res.status(200).json(node);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update hierarchy node
const updateHierarchyNode = async (req, res) => {
  try {
    const { id } = req.params;
    const { hierarchy_id, parent_id, name, description, is_active } = req.body;

    const node = await HierarchyNode.findByPk(id);
    if (!node) return res.status(404).json({ message: "Hierarchy node not found" });


 

    node.hierarchy_id = hierarchy_id || node.hierarchy_id;
    node.parent_id = parent_id !== undefined ? parent_id : node.parent_id;
    node.name = name || node.name;
    node.description = description || node.description;
    if (is_active !== undefined) node.is_active = is_active;

    await node.save();
    res.status(200).json(node);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete hierarchy node
const deleteHierarchyNode = async (req, res) => {
  try {
    const { id } = req.params;
    const node = await HierarchyNode.findByPk(id);
    if (!node) return res.status(404).json({ message: "Hierarchy node not found" });

    await node.destroy();
    res.status(200).json({ message: "Hierarchy node deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createHierarchyNode,
  getHierarchyNodes,
  getHierarchyNodeById,
  updateHierarchyNode,
  deleteHierarchyNode,
};
