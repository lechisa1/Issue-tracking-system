const {
  IssueEscalation,
  Issue,
  User,
  IssueTier,
  IssueEscalationHistory,
  IssueAction,
  IssueStatusHistory,
  ProjectUserRole,
  Role,
  HierarchyNode,
  Permission,
  RolePermission,
  sequelize,
} = require("../../models");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

// Escalate issue
const escalateIssue = async (req, res) => {
  try {
    const { issue_id, from_tier, to_tier, reason, escalated_by } = req.body;

    // Verify issue exists
    const issue = await Issue.findByPk(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // Verify escalator exists
    const escalator = await User.findByPk(escalated_by);
    if (!escalator) {
      return res.status(404).json({ message: "Escalator user not found." });
    }

    const escalation_id = uuidv4();

    // Create escalation record
    const escalation = await IssueEscalation.create({
      escalation_id,
      issue_id,
      from_tier,
      to_tier,
      reason,
      escalated_by,
      escalated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create escalation history record
    await IssueEscalationHistory.create({
      issue_escalation_history_id: uuidv4(),
      issue_id,
      from_tier,
      to_tier,
      escalated_by,
      created_at: new Date(),
    });

    // Create tier handling record
    await IssueTier.create({
      issue_tier_id: uuidv4(),
      issue_id,
      tier_level: to_tier,
      handler_id: null, // Can be assigned later
      assigned_at: new Date(),
      status: "pending",
      remarks: `Escalated from ${from_tier}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create action record
    await IssueAction.create({
      action_id: uuidv4(),
      issue_id,
      action_name: "Issue Escalated",
      action_description: `Escalated from ${from_tier} to ${to_tier}`,
      performed_by: escalated_by,
      related_tier: from_tier,
      created_at: new Date(),
    });

    // Return escalation with relations
    const escalationWithDetails = await IssueEscalation.findOne({
      where: { escalation_id: escalation.escalation_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "escalator" },
      ],
    });

    res.status(201).json(escalationWithDetails);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get escalations by issue ID
const getEscalationsByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const escalations = await IssueEscalation.findAll({
      where: { issue_id },
      include: [{ model: User, as: "escalator" }],
      order: [["escalated_at", "DESC"]],
    });

    res.status(200).json(escalations);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get escalation history by issue ID
const getEscalationHistoryByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const escalationHistory = await IssueEscalationHistory.findAll({
      where: { issue_id },
      include: [
        { model: User, as: "escalator" },
        { model: Issue, as: "issue" },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(escalationHistory);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get escalation by ID
const getEscalationById = async (req, res) => {
  try {
    const { escalation_id } = req.params;

    const escalation = await IssueEscalation.findOne({
      where: { escalation_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "escalator" },
      ],
    });

    if (!escalation) {
      return res.status(404).json({ message: "Escalation not found." });
    }

    res.status(200).json(escalation);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete escalation
const deleteEscalation = async (req, res) => {
  try {
    const { escalation_id } = req.params;

    const escalation = await IssueEscalation.findByPk(escalation_id);
    if (!escalation) {
      return res.status(404).json({ message: "Escalation not found." });
    }

    await IssueEscalation.destroy({
      where: { escalation_id },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Automated escalation flow function
const automatedEscalation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id, escalation_reason, escalation_target } = req.body;

    console.log("Escalatioon Reson" ,escalation_reason );

    const user_id = req.user?.user_id;
    const attachments = req.files || [];

    const issue = await Issue.findByPk(issue_id, {
      include: [
        { model: HierarchyNode, as: "hierarchyNode" }
      ]
    });
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (issue.status !== "in_progress") {
      return res.status(400).json({ message: "Issue must be in progress to escalate" });
    }

    // Check user permissions for direct escalation
    let hasDirectEscalationPermission = false;
    if (escalation_target) {
      // Check if user has the required escalation permission
      const requiredPermission = `direct_to_${escalation_target.toLowerCase()}`;
      hasDirectEscalationPermission = userRoles.some(userRole =>
        userRole.role?.rolePermissions?.some(rp =>
          rp.permission?.resource === "escalation" &&
          rp.permission?.action === requiredPermission
        )
      );
    }

    const hierarchyNode = issue.hierarchyNode;
    if (!hierarchyNode) return res.status(400).json({ message: "Hierarchy node not found" });

    // Handle direct escalation based on target and permissions
    if (escalation_target && hasDirectEscalationPermission) {
      let targetUser = null;
      let targetRoleName = "";
      let actionName = "";
      let actionDescription = "";

      switch (escalation_target.toUpperCase()) {
        case "QAL":
          targetRoleName = "Quality Assurance Leader";
          actionName = "escalated_to_qa_leader";
          actionDescription = "Directly escalated to Quality Assurance Leader";
          break;
        case "QA":
          targetRoleName = "Quality Assurance";
          actionName = "escalated_to_qa";
          actionDescription = "Directly escalated to Quality Assurance";
          break;
        case "FED":
          targetRoleName = "Frontend Developer";
          actionName = "escalated_to_fed";
          actionDescription = "Directly escalated to Frontend Developer";
          break;
        case "BED":
          targetRoleName = "Backend Developer";
          actionName = "escalated_to_bed";
          actionDescription = "Directly escalated to Backend Developer";
          break;
        default:
          return res.status(400).json({ message: "Invalid escalation target" });
      }

      // Find user with the target role
      targetUser = await ProjectUserRole.findOne({
        where: {
          project_id: issue.project_id,
          role_id: {
            [Op.in]: await Role.findAll({
              where: { name: targetRoleName },
              attributes: ["role_id"]
            }).then(roles => roles.map(r => r.role_id))
          }
        },
        include: [{ model: User, as: "user" }]
      });

      if (!targetUser) return res.status(400).json({ message: `${targetRoleName} not found` });

      // Update issue to assigned to target user
      await issue.update({
        assigned_to: targetUser.user_id,
        status: "assigned_committee",
        updated_at: new Date()
      }, { transaction: t });

      // Create action
      await IssueAction.create({
        action_id: uuidv4(),
        issue_id,
        action_name: actionName,
        action_description: actionDescription,
        performed_by: user_id,
        related_tier: targetRoleName,
        created_at: new Date()
      }, { transaction: t });

      await t.commit();
      return res.json({ success: true, message: `Issue directly escalated to ${targetRoleName}` });
    }

    // Check if at top level (parent_id is null) - default escalation to QA Leader
    if (!hierarchyNode.parent_id) {
      // Find user with permission to be QA Leader
      const qaLeader = await ProjectUserRole.findOne({
        where: {
          project_id: issue.project_id,
          is_active: true
        },
        include: [
          {
            model: Role,
            as: "role",
            include: [
              {
                model: RolePermission,
                as: "rolePermissions",
                include: [{ model: Permission, as: "permission" }]
              }
            ]
          },
          { model: User, as: "user" }
        ]
      });

      // Check if the user has the permission to be QA Leader
      const hasQALeaderPermission = qaLeader && qaLeader.role?.rolePermissions?.some(rp =>
        rp.permission?.action === "can_escalate_direct_to_qal"
      );

      if (!qaLeader || !hasQALeaderPermission) return res.status(400).json({ message: "Quality Assurance Leader not found" });

      // Update issue to assigned to QA Leader
      await issue.update({
        assigned_to: qaLeader.user_id,
        status: "assigned_committee",
        updated_at: new Date()
      }, { transaction: t });

      // Create action
      await IssueAction.create({
        action_id: uuidv4(),
        issue_id,
        action_name: "escalated_to_qa_leader",
        action_description: "Escalated to Quality Assurance Leader",
        performed_by: user_id,
        related_tier: "Quality Assurance",
        created_at: new Date()
      }, { transaction: t });

      await t.commit();
      return res.json({ success: true, message: "Issue escalated to Quality Assurance Leader" });
    } else {
      // Normal hierarchy escalation
      const parentNode = await HierarchyNode.findByPk(hierarchyNode.parent_id);
      if (!parentNode) return res.status(400).json({ message: "Parent hierarchy not found" });

      await issue.update({
        hierarchy_node_id: parentNode.hierarchy_node_id,
        assigned_to: null,
        updated_at: new Date()
      }, { transaction: t });

      // Create action
      await IssueAction.create({
        action_id: uuidv4(),
        issue_id,
        action_name: "escalated",
        action_description: `Escalated from ${hierarchyNode.name} to ${parentNode.name}`,
        performed_by: user_id,
        related_tier: parentNode.name,
        created_at: new Date()
      }, { transaction: t });

      await t.commit();
      return res.json({ success: true, message: "Issue escalated to parent hierarchy" });
    }
  } catch (error) {
    await t.rollback();
    console.error("AUTOMATED ESCALATION ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Assign to Quality Assurance team
const assignToQATeam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id, qa_user_id } = req.body;
    const user_id = req.user?.user_id;

    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Verify QA user has Quality Assurance role
    const qaUserRole = await ProjectUserRole.findOne({
      where: {
        user_id: qa_user_id,
        project_id: issue.project_id,
        role_id: {
          [Op.in]: await Role.findAll({
            where: { name: "Quality Assurance" },
            attributes: ["role_id"]
          }).then(roles => roles.map(r => r.role_id))
        }
      }
    });

    if (!qaUserRole) return res.status(400).json({ message: "User is not a Quality Assurance member" });

    await issue.update({
      assigned_to: qa_user_id,
      status: "assigned_committee",
      updated_at: new Date()
    }, { transaction: t });

    await IssueAction.create({
      action_id: uuidv4(),
      issue_id,
      action_name: "assigned_to_qa",
      action_description: "Assigned to Quality Assurance team member",
      performed_by: user_id,
      related_tier: "Quality Assurance",
      created_at: new Date()
    }, { transaction: t });

    await t.commit();
    return res.json({ success: true, message: "Issue assigned to QA team member" });
  } catch (error) {
    await t.rollback();
    console.error("ASSIGN TO QA ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Assign to Developer
const assignToDeveloper = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id, developer_user_id } = req.body;
    const user_id = req.user?.user_id;

    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Verify developer has Developer role
    const devUserRole = await ProjectUserRole.findOne({
      where: {
        user_id: developer_user_id,
        project_id: issue.project_id,
        role_id: {
          [Op.in]: await Role.findAll({
            where: { name: "Developer" },
            attributes: ["role_id"]
          }).then(roles => roles.map(r => r.role_id))
        }
      }
    });

    if (!devUserRole) return res.status(400).json({ message: "User is not a Developer" });

    await issue.update({
      assigned_to: developer_user_id,
      status: "assigned",
      updated_at: new Date()
    }, { transaction: t });

    await IssueAction.create({
      action_id: uuidv4(),
      issue_id,
      action_name: "assigned_to_developer",
      action_description: "Assigned to Developer",
      performed_by: user_id,
      related_tier: "Developer",
      created_at: new Date()
    }, { transaction: t });

    await t.commit();
    return res.json({ success: true, message: "Issue assigned to Developer" });
  } catch (error) {
    await t.rollback();
    console.error("ASSIGN TO DEVELOPER ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Mark issue as in progress
const markAsInProgress = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { issue_id } = req.body;
    const user_id = req.user?.user_id;

    console.log("user id" , user_id)

    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const oldStatus = issue.status;

    // Update issue status to in_progress
    await issue.update({
      status: "in_progress",
      updated_at: new Date()
    }, { transaction: t });

    // Create status history record
    const statusHistory = await IssueStatusHistory.create({
      status_history_id: uuidv4(),
      issue_id,
      from_status: oldStatus,
      to_status: "in_progress",
      changed_by: user_id,
      reason: "Marked as in progress",
      created_at: new Date()
    }, { transaction: t });

    console.log(statusHistory , "statusHistory")

    // Create action record
    await IssueAction.create({
      action_id: uuidv4(),
      issue_id,
      action_name: "marked_as_in_progress",
      action_description: "Issue marked as in progress",
      performed_by: user_id,
      created_at: new Date()
    }, { transaction: t });

    await t.commit();
    return res.json({ success: true, message: "Issue marked as in progress" });
  } catch (error) {
    await t.rollback();
    console.error("MARK AS IN PROGRESS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Update module exports
module.exports = {
  escalateIssue,
  automatedEscalation,
  assignToQATeam,
  assignToDeveloper,
  markAsInProgress,
  getEscalationsByIssueId,
  getEscalationHistoryByIssueId,
  getEscalationById,
  deleteEscalation,
};
