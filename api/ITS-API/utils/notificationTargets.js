const { HierarchyNode, User } = require("../models");
const { Op } = require("sequelize");

/**
 * Finds users in same hierarchy level except the reporter.
 */
async function getUsersToNotifyOnIssueCreate(hierarchy_node_id, reporter_id) {
  const node = await HierarchyNode.findByPk(hierarchy_node_id);
  if (!node) return [];

  // Get all sibling hierarchy nodes
  const siblings = await HierarchyNode.findAll({
    where: { level: node.level },
  });

  const siblingNodeIds = siblings.map((n) => n.hierarchy_node_id);

  // Get all users in these sibling nodes except the reporter
  return (
    await User.findAll({
      where: {
        hierarchy_node_id: { [Op.in]: siblingNodeIds },
        user_id: { [Op.ne]: reporter_id },
      },
    })
  ).map((u) => u.user_id);
}

module.exports = {
  getUsersToNotifyOnIssueCreate,
};
