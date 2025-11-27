const {
  IssueEscalation,
  Issue,
  User,
  UserType,
  IssueTier,
  Attachment,
  EscalationAttachment,
  IssueEscalationHistory,
  IssueAction,
  IssueStatusHistory,
  ProjectUserRole,
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

// ------------------------------------------------------
//  ESCALATE ISSUE
// ------------------------------------------------------
const escalateIssue = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      issue_id,
      from_tier,
      to_tier,
      reason,
      escalated_by,
      attachment_ids,
    } = req.body;

    // 1. Validate Issue
    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    // 2. Validate User
    const escalator = await User.findByPk(escalated_by);
    if (!escalator)
      return res
        .status(404)
        .json({ message: "User (escalated_by) not found." });

    // 2.1 Check if escalator is at top level (parent_id is null)
    const escalatorRoles = await ProjectUserRole.findAll({
      where: { user_id: escalated_by, project_id: issue.project_id },
      include: [
        {
          model: HierarchyNode,
          as: "hierarchyNode"
        }
      ]
    });

    const isTopLevel = escalatorRoles.some(role => role.hierarchyNode?.parent_id === null);

    if (isTopLevel) {
      // Fetch all users assigned to the project, including their roles and permissions
  
      // Preferred: ask Sequelize to only return users that have a ProjectUserRole for this project
      const projectUsers = await User.findAll({
        where: { is_active: true },
        include: [
          {
            model: UserType,
            as: "userType",
            where: { name: 'internal_user' }
          },
          {
            model: ProjectUserRole,
            as: "projectRoles",
            where: { project_id: issue.project_id },
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
              }
            ]
          }
        ]
      });

   

      console.log("Filtered Project Users (same project):", projectUsers);
    
// console.log("Project Users with Roles and Permissions:", projectUsers);

      // Find the user with can_escalate_to_qam permission
      const qalUser = projectUsers.find(user =>
        user.projectRoles.some(projectRole =>
          projectRole.role?.rolePermissions?.some(rp =>
            rp.permission?.action === "can_escalate_to_qam"
          )
        )
      );
console.log("Found QAL User:", qalUser);
      

      if (qalUser) {
        // Assign issue to QAL instead of creating escalation
        await issue.update({
          assigned_to: qalUser.user_id,
          status: "in_progress",
          updated_at: new Date()
        }, { transaction: t });

        // Log Action
        await IssueAction.create(
          {
            action_id: uuidv4(),
            issue_id,
            action_name: "Escalated to QAL",
            action_description: `Escalated from ${from_tier} to Quality Assurance Leader`,
            performed_by: escalated_by,
            related_tier: "Quality Assurance Leader",
          },
          { transaction: t }
        );

        await t.commit();

        return res.status(200).json({
          message: "Issue escalated to Quality Assurance Leader",
          assigned_to: qalUser.user_id
        });
      }
    }

    const escalation_id = uuidv4();

    // 3. Create escalation
    await IssueEscalation.create(
      {
        escalation_id,
        issue_id,
        from_tier,
        to_tier,
        reason,
        escalated_by,
        escalated_at: new Date(),
      },
      { transaction: t }
    );

    // 4. Attach files
    if (attachment_ids?.length > 0) {
      const links = attachment_ids.map((attachment_id) => ({
        escalation_id,
        attachment_id,
        created_at: new Date(),
      }));

      await EscalationAttachment.bulkCreate(links, { transaction: t });
    }

    // 5. History
    // await IssueEscalationHistory.create(
    //   {
    //     issue_escalation_history_id: uuidv4(),
    //     issue_id,
    //     from_tier,
    //     to_tier,
    //     escalated_by,
    //   },
    //   { transaction: t }
    // );

    // 6. Create tier entry (for new tier assignment)
    await IssueTier.create(
      {
        issue_tier_id: uuidv4(),
        issue_id,
        tier_level: to_tier,
        handler_id: null,
        assigned_at: new Date(),
        status: "pending",
        remarks: `Escalated from ${from_tier}`,
      },
      { transaction: t }
    );

    // 7. Log Action
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "Issue Escalated",
        action_description: `Escalated from ${from_tier} to ${to_tier}`,
        performed_by: escalated_by,
        related_tier: from_tier,
      },
      { transaction: t }
    );

    // COMMIT ALL
    await t.commit();

    // Return escalation with details
    const fullEscalation = await IssueEscalation.findOne({
      where: { escalation_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "escalator" },
        {
          model: EscalationAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
    });

    return res.status(201).json(fullEscalation);
  } catch (error) {
    console.error("ESCALATION ERROR:", error);
    await t.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  GET ESCALATIONS BY ISSUE ID
// ------------------------------------------------------
const getEscalationsByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const data = await IssueEscalation.findAll({
      where: { issue_id },
      include: [
        { model: User, as: "escalator" },
        {
          model: EscalationAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
      order: [["escalated_at", "DESC"]],
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("ESCALATION FETCH ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  GET ESCALATION HISTORY BY ISSUE ID
// ------------------------------------------------------
const getEscalationHistoryByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const history = await IssueEscalationHistory.findAll({
      where: { issue_id },
      include: [
        { model: User, as: "escalator" },
        { model: Issue, as: "issue" },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(history);
  } catch (error) {
    console.error("ESCALATION HISTORY ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  GET ESCALATION BY ID
// ------------------------------------------------------
const getEscalationById = async (req, res) => {
  try {
    const { escalation_id } = req.params;

    const escalation = await IssueEscalation.findOne({
      where: { escalation_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "escalator" },
        {
          model: EscalationAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
    });

    if (!escalation)
      return res.status(404).json({ message: "Escalation not found" });

    return res.status(200).json(escalation);
  } catch (error) {
    console.error("GET ESCALATION ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  DELETE ESCALATION
// ------------------------------------------------------
const deleteEscalation = async (req, res) => {
  try {
    const { escalation_id } = req.params;

    const escalation = await IssueEscalation.findByPk(escalation_id);
    if (!escalation)
      return res.status(404).json({ message: "Escalation not found" });

    await IssueEscalation.destroy({ where: { escalation_id } });

    return res.status(204).send();
  } catch (error) {
    console.error("DELETE ESCALATION ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};




const getEscalatedIssuesWithNullTierFiltered = async (req, res) => {
  try {
    const { pairs, user_id } = req.params;

    // Build where clause for IssueEscalation
    const whereClause = {
      to_tier: null,
    };

    // If pairs param provided, parse and filter (assuming pairs is comma separated string of tiers)
    if (pairs) {
      const pairsArray = pairs.split(',').map(pair => pair.trim());
      // Here pairs filtering logic can be applied based on domain logic
      // For now, as example, assuming pairsArray are from_tier values to filter
      if (pairsArray.length > 0) {
        whereClause.from_tier = {
          [sequelize.Op.in]: pairsArray
        };
      }
    }

    // Query IssueEscalation with filters and includes
    const escalatedNullTier = await IssueEscalation.findAll({
      where: whereClause,
      include: [
        {
          model: Issue,
          as: "issue",
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
        },
        {
          model: User,
          as: "escalator"
        }
      ],
    });

    // Filter by user_id if provided (checks if user is reporter, assignee, or escalator)
    let filteredRecords = escalatedNullTier;
    if (user_id) {
      filteredRecords = escalatedNullTier.filter(record => {
        const issue = record.issue;
        return (
          (issue.reporter && issue.reporter.user_id === user_id) ||
          (issue.assignee && issue.assignee.user_id === user_id) ||
          (record.escalator && record.escalator.user_id === user_id)
        );
      });
    }

    // Extract issues
    const issues = filteredRecords.map(record => record.issue);

    res.status(200).json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    console.error("Error fetching escalated issues with null tier:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
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

  markAsInProgress,
  getEscalationsByIssueId,
  getEscalationHistoryByIssueId,
  getEscalationById,
  deleteEscalation,
  
};
