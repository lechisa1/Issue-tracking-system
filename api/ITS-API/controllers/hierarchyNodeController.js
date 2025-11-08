const { HierarchyNode, Hierarchy } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Recursive function to create hierarchy nodes from nested structure
const createNodeRecursive = async (
  nodeData,
  hierarchy_id,
  parent_id = null,
  level = 1
) => {
  const { name, description, is_active, children } = nodeData;

  // Check if node exists with the same name in the same hierarchy
  const existingNode = await HierarchyNode.findOne({
    where: { name, hierarchy_id },
  });
  if (existingNode) {
    throw new Error(
      `Hierarchy node with name '${name}' already exists in this hierarchy.`
    );
  }

  const hierarchy_node_id = uuidv4();

  // Create node
  const node = await HierarchyNode.create({
    hierarchy_node_id,
    hierarchy_id,
    parent_id,
    name,
    description,
    level,
    is_active,
  });

  const createdNodes = [node];

  // Recursively create children
  if (children && Array.isArray(children)) {
    for (const child of children) {
      const childNodes = await createNodeRecursive(
        child,
        hierarchy_id,
        hierarchy_node_id,
        level + 1
      );
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
      const allCreatedNodes = [];

      for (const rootNodeData of input) {
        const { hierarchy_id } = rootNodeData;

        const hierarchy = await Hierarchy.findByPk(hierarchy_id);
        if (!hierarchy) {
          return res.status(404).json({
            message: `Hierarchy with id '${hierarchy_id}' not found.`,
          });
        }

        const createdNodes = await createNodeRecursive(
          rootNodeData,
          hierarchy_id,
          rootNodeData.parent_id || null
        );
        allCreatedNodes.push(...createdNodes);
      }

      return res.status(201).json(allCreatedNodes);
    } else {
      const { hierarchy_id, parent_id } = input;

      const hierarchy = await Hierarchy.findByPk(hierarchy_id);
      if (!hierarchy) {
        return res
          .status(404)
          .json({ message: `Hierarchy with id '${hierarchy_id}' not found.` });
      }

      const createdNodes = await createNodeRecursive(
        input,
        hierarchy_id,
        parent_id || null
      );
      return res.status(201).json(createdNodes);
    }
  } catch (error) {
    console.error(error);
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
        { model: Hierarchy, as: "hierarchy" },
        { model: HierarchyNode, as: "parent" },
        { model: HierarchyNode, as: "children" },
      ],
    });
    res.status(200).json(nodes);
  } catch (error) {
    console.error(error);
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
        { model: Hierarchy, as: "hierarchy" },
        { model: HierarchyNode, as: "parent" },
        { model: HierarchyNode, as: "children" },
      ],
    });

    if (!node)
      return res.status(404).json({ message: "Hierarchy node not found" });
    res.status(200).json(node);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update hierarchy node
const updateHierarchyNode = async (req, res) => {
  try {
    const { id } = req.params;
    const { hierarchy_id, parent_id, name, description, is_active } = req.body;

    const node = await HierarchyNode.findByPk(id);
    if (!node)
      return res.status(404).json({ message: "Hierarchy node not found" });

    // Check duplicate name in the same hierarchy
    if (name && name !== node.name) {
      const existingNode = await HierarchyNode.findOne({
        where: { name, hierarchy_id: hierarchy_id || node.hierarchy_id },
      });
      if (existingNode) {
        return res.status(400).json({
          message: `Hierarchy node with name '${name}' already exists in this hierarchy.`,
        });
      }
    }

    // Recalculate level if parent_id is updated
    let level = node.level;
    if (parent_id !== undefined && parent_id !== node.parent_id) {
      if (parent_id) {
        const parentNode = await HierarchyNode.findByPk(parent_id);
        if (!parentNode)
          return res.status(404).json({ message: "Parent node not found" });

        if (parentNode.hierarchy_id !== (hierarchy_id || node.hierarchy_id)) {
          return res
            .status(400)
            .json({ message: "Parent node must belong to the same hierarchy" });
        }

        level = parentNode.level + 1;
      } else {
        level = 1;
      }
    }

    node.hierarchy_id = hierarchy_id || node.hierarchy_id;
    node.parent_id = parent_id !== undefined ? parent_id : node.parent_id;
    node.name = name || node.name;
    node.description = description || node.description;
    node.level = level;
    if (is_active !== undefined) node.is_active = is_active;

    await node.save();
    res.status(200).json(node);
  } catch (error) {
    console.error(error);
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
      return res.status(404).json({ message: "Hierarchy node not found" });

    await node.destroy();
    res.status(200).json({ message: "Hierarchy node deleted successfully" });
  } catch (error) {
    console.error(error);
    res
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
};
