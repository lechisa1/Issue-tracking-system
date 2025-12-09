
const { HierarchyNode } = require("../models");

/**
 * Get hierarchy node name by ID
 * @param {string} hierarchy_node_id
 * @returns {Promise<string|null>}
 */
async function getHierarchyNodeName(hierarchy_node_id) {
  if (!hierarchy_node_id) return null;

  try {
    const node = await HierarchyNode.findByPk(hierarchy_node_id, {
      attributes: ["name"],
    });
    return node ? node.name : null;
  } catch (error) {
    console.error(
      `❌ Error fetching hierarchy node name for ID ${hierarchy_node_id}:`,
      error
    );
    return null;
  }
}

module.exports = {
  getHierarchyNodeName

};
