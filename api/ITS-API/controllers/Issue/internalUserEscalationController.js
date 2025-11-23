const {
  IssueEscalation,
  Issue,
  User,
  UserType,
  Institute,
  IssueTier,
  Attachment,
  EscalationAttachment,
  IssueEscalationHistory,
  IssueAction,
  IssueStatusHistory,
  ProjectUserRole,
  ProjectUser,
  Role,
  HierarchyNode,
  Permission,
  RolePermission,
  Project,
  IssueCategory,
  IssuePriority,
  IssueComment,
  IssueAttachment,
  sequelize,
} = require("../../models");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

// Define internal roles

// ------------------------------------------------------
//  ESCALATE INTERNAL ISSUE
// ------------------------------------------------------
const escalateInternalIssue = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { issue_id, from_tier, to_tier, reason, escalated_by, attachment_ids } = req.body;

    // 1. Validate Issue
    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    // 2. Validate User
    const escalator = await User.findByPk(escalated_by);
    if (!escalator) return res.status(404).json({ message: "Escalator not found." });

    const escalation_id = uuidv4();

    // 3. Update Issue status and assigned_to
    await issue.update(
      { assigned_to: to_tier, status: "in_progress", updated_at: new Date() },
      { transaction: t }
    );

    // 4. Create escalation
    await IssueEscalation.create(
      { escalation_id, issue_id, from_tier, to_tier, reason, escalated_by, escalated_at: new Date() },
      { transaction: t }
    );

    // 5. Attach files if any
    if (attachment_ids?.length) {
      const attachments = attachment_ids.map(id => ({
        escalation_id,
        attachment_id: id,
        created_at: new Date(),
      }));
      await EscalationAttachment.bulkCreate(attachments, { transaction: t });
    }

    // 6. Create tier entry
    await IssueTier.create(
      {
        issue_tier_id: uuidv4(),
        issue_id,
        tier_level: to_tier,
        handler_id: to_tier,
        assigned_at: new Date(),
        status: "pending",
        remarks: `Escalated from ${from_tier}`,
      },
      { transaction: t }
    );

    // 7. Log action
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "Internal Issue Escalated",
        action_description: `Escalated from ${from_tier} to ${to_tier}`,
        performed_by: escalated_by,
        related_tier: from_tier,
      },
      { transaction: t }
    );

    // 8. Log status history
    await IssueStatusHistory.create(
      {
        status_history_id: uuidv4(),
        issue_id,
        status: "escalated",
        changed_by: escalated_by,
        changed_at: new Date(),
        remarks: `Escalated to ${to_tier}`,
      },
      { transaction: t }
    );

    // COMMIT
    await t.commit();

    // 9. Return full escalation
    const fullEscalation = await IssueEscalation.findOne({
      where: { escalation_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "escalator" },
        { model: EscalationAttachment, as: "attachments", include: [{ model: Attachment, as: "attachment" }] },
      ],
    });

    return res.status(201).json(fullEscalation);
  } catch (error) {
    console.error("INTERNAL ESCALATION ERROR:", error);
    await t.rollback();
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  GET INTERNAL ISSUES (issues assigned to the logged-in user)
// ------------------------------------------------------
const getInternalIssues = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find issues assigned to the logged-in user, excluding those reported by the user
    const issues = await Issue.findAll({
      where: {
        assigned_to: user_id,
        reported_by: { [Op.ne]: user_id }
      },
      include: [
        { model: Project, as: "project", include: [{ model: ProjectUserRole, as: "projectUserRoles", include: [{ model: User, as: "user", include: [{ model: Institute, as: "institute" }] }, { model: Role, as: "role", include: [{ model: Permission, as: "permissions" }] }] }] },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: HierarchyNode, as: "hierarchyNode" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
        {
          model: IssueComment,
          as: "comments",
          include: [{ model: User, as: "author" }],
        },
        {
          model: IssueAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
        {
          model: IssueAction,
          as: "actions",
          include: [{ model: User, as: "performer" }], // Assuming alias for performed_by user
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ issues });
  } catch (error) {
    console.error("GET INTERNAL ISSUES ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  GET INTERNAL ISSUE BY ID
// ------------------------------------------------------
const getInternalIssueById = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const issue = await Issue.findOne({
      where: { issue_id },
      include: [
        { model: Project, as: "project" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: HierarchyNode, as: "hierarchyNode" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
        {
          model: IssueComment,
          as: "comments",
          include: [{ model: User, as: "author" }],
        },
        {
          model: IssueAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
    });

    if (!issue) return res.status(404).json({ message: "Issue not found" });

    return res.status(200).json(issue);
  } catch (error) {
    console.error("GET INTERNAL ISSUE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  UPDATE INTERNAL ISSUE
// ------------------------------------------------------
const updateInternalIssue = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { issue_id } = req.params;
    const updateData = req.body;

    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    await issue.update(updateData, { transaction: t });

    // Log Action
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "Internal Issue Updated",
        action_description: "Issue details updated",
        performed_by: req.user?.user_id || updateData.updated_by,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({ message: "Issue updated successfully", issue });
  } catch (error) {
    await t.rollback();
    console.error("UPDATE INTERNAL ISSUE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  DELETE INTERNAL ISSUE
// ------------------------------------------------------
const deleteInternalIssue = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { issue_id } = req.params;

    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    await issue.destroy({ transaction: t });

    await t.commit();

    return res.status(204).send();
  } catch (error) {
    await t.rollback();
    console.error("DELETE INTERNAL ISSUE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  ADD ATTACHMENT TO INTERNAL ISSUE
// ------------------------------------------------------
const addAttachmentToInternalIssue = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { issue_id } = req.params;
    const { attachment_id } = req.body;

    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    await IssueAttachment.create(
      {
        issue_attachment_id: uuidv4(),
        issue_id,
        attachment_id,
        uploaded_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({ message: "Attachment added successfully" });
  } catch (error) {
    await t.rollback();
    console.error("ADD ATTACHMENT ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  GET INTERNAL USERS BY ISSUE PROJECT
// ------------------------------------------------------
const getInternalUsersByIssueProject = async (req, res) => {
  try {
    const { issue_id } = req.params;

    if (!issue_id) {
      return res.status(400).json({
        success: false,
        message: "Issue ID is required.",
      });
    }

    // Find the issue to get the project_id
    const issue = await Issue.findByPk(issue_id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["project_id"],
        },
      ],
    });

    if (!issue || !issue.project) {
      return res.status(404).json({
        success: false,
        message: "Issue or associated project not found.",
      });
    }

    const project_id = issue.project.project_id;

    // Fetch internal users assigned to this project
    const internalUsers = await User.findAll({
      where: {
        is_active: true,
        "$userType.name$": "internal_user",
      },
      include: [
        {
          model: UserType,
          as: "userType",
          attributes: ["name"],
          required: true,
        },
        {
          model: ProjectUserRole,
          as: "projectRoles",
          where: { project_id },
          required: true,
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["name"],
            },
          ],
        },
      ],
      attributes: ["user_id", "full_name", "email"],
      order: [["full_name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Internal users fetched successfully.",
      data: internalUsers,
    });
  } catch (error) {
    console.error("Error fetching internal users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch internal users.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
//  GET INTERNAL ISSUE ACTIONS (Action History)
// ------------------------------------------------------
const getInternalIssueActions = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const actions = await IssueAction.findAll({
      where: { issue_id },
      include: [
        {
          model: User,
          as: "performer",
          attributes: ["user_id", "full_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ actions });
  } catch (error) {
    console.error("GET INTERNAL ISSUE ACTIONS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  ASSIGN TO QA TEAM OR HANDLE BILATERAL ESCALATION
// ------------------------------------------------------
const assignToQATeam = async (req, res) => {
  const { issue_id, from_tier, to_tier, escalated_by } = req.body;

  try {
    let final_to_tier = to_tier;

    // If from_tier is 'developer', implement bilateral escalation logic
    if (from_tier === 'developer') {
      // Find the latest escalation for the issue to get the from_tier
      const latestEscalation = await IssueEscalation.findOne({
        where: { issue_id },
        order: [['escalated_at', 'DESC']],
      });

      if (latestEscalation) {
        final_to_tier = latestEscalation.from_tier;
      } else {
        return res.status(400).json({
          success: false,
          message: "No escalation history found for bilateral escalation",
        });
      }
    }

    // Update the issue's assigned_to field
    const issueUpdate = await Issue.update(
      { assigned_to: final_to_tier },
      { where: { issue_id } }
    );

    // Create or update IssueTier entry
    const [issueTier, created] = await IssueTier.upsert({
      issue_id,
      tier: final_to_tier,
    });

    // Log the action in IssueAction
    const actionName = from_tier === 'developer' ? "Developer Submitted - Returned to Previous Tier" : "Assigned to QA";
    const actionDescription = from_tier === 'developer'
      ? `Issue returned to ${final_to_tier} after developer submission`
      : `Issue assigned to QA user ${final_to_tier} from ${from_tier}`;

    await IssueAction.create({
      action_id: uuidv4(),
      issue_id,
      action_name: actionName,
      action_description: actionDescription,
      performed_by: escalated_by,
    });

    res.status(200).json({
      success: true,
      message: from_tier === 'developer' ? "Issue returned to previous tier successfully" : "Issue assigned to QA team successfully",
      data: { issueUpdate, issueTier },
    });
  } catch (error) {
    console.error("Error in assignToQATeam:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign issue",
      error: error.message,
    });
  }
};

// Update module exports
module.exports = {
  escalateInternalIssue,
  getInternalIssues,
  getInternalIssueById,
  updateInternalIssue,
  deleteInternalIssue,
  addAttachmentToInternalIssue,
  getInternalUsersByIssueProject,
  getInternalIssueActions,
  assignToQATeam,
};
