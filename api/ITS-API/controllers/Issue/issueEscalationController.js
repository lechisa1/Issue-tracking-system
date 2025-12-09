const {
  IssueEscalation,
  Issue,
  User,
  IssueTier,
  Attachment,
  IssueHistory,
  EscalationAttachment,
  IssueEscalationHistory,
  IssueAction,
  InternalProjectUserRole,
  ProjectUserRole,
  HierarchyNode,
  InternalNode,
  sequelize,
} = require("../../models");
const {
  createNotification,
  sendEmailForNotification,
  getUsersForHierarchyNode,
  getUsersWithParentHierarchy,
} = require("../../services/notificationService");
const { getHierarchyNodeName } = require("../../utils/hierarchyUtils");
const { v4: uuidv4 } = require("uuid");

// Helper function to get root-level institute users for a specific project
const getRootLevelInstituteUsersForProject = async (project_id) => {
  try {
    const rootUsers = await User.findAll({
      include: [
        {
          model: ProjectUserRole,
          as: "projectRoles",
          where: {
            project_id: project_id,
            is_active: true,
          },
          required: true,
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          where: {
            parent_id: null,
          },
          required: true,
        },
      ],
      attributes: ["user_id", "full_name", "email"],
    });

    return rootUsers;
  } catch (error) {
    console.error(
      "Error fetching root-level institute users for project:",
      error
    );
    return [];
  }
};

// Helper function to get root-level internal users assigned to a project
const getRootLevelInternalUsersForProject = async (project_id) => {
  try {
    const internalAssignments = await InternalProjectUserRole.findAll({
      where: {
        project_id: project_id,
        is_active: true,
      },
      include: [
        {
          model: InternalNode,
          as: "internalNode",
          attributes: ["internal_node_id", "parent_id"],
        },
        {
          model: User,
          as: "user",
          attributes: ["user_id", "full_name", "email"],
        },
      ],
    });

    // Filter assignments where InternalNode.parent_id is null
    const rootLevelAssignments = internalAssignments.filter(
      (assignment) =>
        assignment.internalNode && assignment.internalNode.parent_id === null
    );

    // Extract unique users
    const usersMap = new Map();
    rootLevelAssignments.forEach((assignment) => {
      if (assignment.user) {
        usersMap.set(assignment.user.user_id, assignment.user);
      }
    });

    const users = Array.from(usersMap.values());

    return users;
  } catch (error) {
    console.error(
      "Error fetching root-level internal users for project:",
      error
    );
    return [];
  }
};

// Helper function to get users already handling escalated issues with null tier for a specific project
const getUsersHandlingNullTierEscalationsForProject = async (project_id) => {
  try {
    // Find issues that are escalated with null tier for this project
    const nullTierEscalations = await IssueEscalation.findAll({
      where: { to_tier: null },
      include: [
        {
          model: Issue,
          as: "issue",
          where: { project_id: project_id },
          attributes: ["issue_id", "assigned_to"],
        },
      ],
    });

    const userIds = nullTierEscalations
      .map((esc) => esc.issue?.assigned_to)
      .filter(Boolean);

    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) return [];

    const users = await User.findAll({
      where: { user_id: uniqueUserIds },
      attributes: ["user_id", "full_name", "email"],
    });

    return users;
  } catch (error) {
    console.error(
      "Error fetching users handling null-tier escalations for project:",
      error
    );
    return [];
  }
};

// Helper function to get users with parent hierarchy (existing function)
const getUsersWithParentHierarchys = async (hierarchy_node_id) => {
  try {
    // Find the parent node
    const hierarchyNode = await HierarchyNode.findByPk(hierarchy_node_id);
    if (!hierarchyNode || !hierarchyNode.parent_id) return [];

    // Get users assigned to the parent node
    const parentUsers = await User.findAll({
      include: [
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          where: { hierarchy_node_id: hierarchyNode.parent_id },
          required: true,
        },
      ],
      attributes: ["user_id", "full_name", "email"],
    });

    return parentUsers;
  } catch (error) {
    console.error("Error fetching users with parent hierarchy:", error);
    return [];
  }
};

// ------------------------------------------------------
//  ESCALATE ISSUE

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

    // 6. Create tier entry (for new tier assignment)
    await IssueTier.create(
      {
        issue_tier_id: uuidv4(),
        issue_id,
        tier_level: to_tier,
        handler_id: null,
        assigned_at: new Date(),
        status: "escalated",
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

    // ==================================
    // 8. CREATE IssueHistory ENTRY (NEW)
    // ==================================
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id: issue_id,
        user_id: escalated_by,
        action: "escalated",
        status_at_time: issue.status, // Issue status doesn't change here
        escalation_id: escalation_id,
        resolution_id: null,
        notes: `Escalated from tier ${from_tier} to tier ${to_tier}. Reason: ${reason}`,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 9. Update issue status to 'pending'
    const oldStatus = issue.status;
    issue.status = "escalated"; // <--- status update
    await issue.save({ transaction: t });

    // 10. ENHANCED NOTIFICATION LOGIC
    // ==================================
    const recipientsSet = new Set();

    // A. If to_tier is null (escalated to root) → notify all root-level users
    if (to_tier === null) {
      // Get the project ID from the issue
      const project_id = issue.project_id;
      // 1. Notify institute users without parent nodes who are assigned to this project
      const rootLevelInstituteUsers =
        await getRootLevelInstituteUsersForProject(project_id);

      rootLevelInstituteUsers.forEach((u) => {
        if (u.user_id !== escalated_by) {
          // Exclude escalator
          recipientsSet.add(u.user_id);
        }
      });

      // 2. Notify ROOT-LEVEL internal users assigned to this project (internal users with InternalNode.parent_id = null)
      const rootLevelInternalUsers = await getRootLevelInternalUsersForProject(
        project_id
      );

      rootLevelInternalUsers.forEach((u) => {
        if (u.user_id !== escalated_by) {
          recipientsSet.add(u.user_id);
        }
      });

      // Debug to see the difference
      const allInternalUsers = await User.findAll({
        include: [
          {
            model: InternalProjectUserRole,
            as: "internalProjectUserRoles",
            where: {
              project_id: project_id,
              is_active: true,
            },
            required: true,
          },
        ],
        attributes: ["user_id", "full_name", "email"],
      });

      // 3. Also notify users already handling escalated issues with null tier in this project
      const escalatedUsers =
        await getUsersHandlingNullTierEscalationsForProject(project_id);
      escalatedUsers.forEach((u) => {
        if (u.user_id !== escalated_by) {
          recipientsSet.add(u.user_id);
        }
      });
    }
    // B. If to_tier has a value → notify target tier and its parent (existing logic)
    else if (to_tier) {
      console.log(`🔍 Escalating to specific tier: ${to_tier}`);

      // Notify users at the target tier (to_tier)
      const targetTierUsers = await getUsersForHierarchyNode(to_tier);
      targetTierUsers.forEach((u) => {
        if (u.user_id !== escalated_by) {
          recipientsSet.add(u.user_id);
        }
      });

      // Notify users at the PARENT of the target tier (one level higher)
      console.log(`🔍 Finding parent hierarchy for escalated tier: ${to_tier}`);

      const parentTierUsers = await getUsersWithParentHierarchys(to_tier);
      console.log(
        "👥 Users found at parent tier:",
        parentTierUsers.map((u) => ({ user_id: u.user_id, name: u.full_name }))
      );

      parentTierUsers.forEach((u) => {
        if (u.user_id !== escalated_by) {
          recipientsSet.add(u.user_id);
          console.log(
            `👥 Added parent tier user: ${u.user_id} (${u.full_name})`
          );
        }
      });

      // Fallback: If no parent users found, log it
      if (parentTierUsers.length === 0) {
        console.log("ℹ️ No users found at parent hierarchy level");

        // Fall back to root-level users for this project
        const project_id = issue.project_id;
        const fallbackInstituteUsers =
          await getRootLevelInstituteUsersForProject(project_id);
        fallbackInstituteUsers.forEach((u) => {
          if (u.user_id !== escalated_by) {
            recipientsSet.add(u.user_id);
            console.log(
              `🔄 Fallback to root-level institute user: ${u.user_id}`
            );
          }
        });
      }
    }

    // C. Always notify the original assignee and reporter
    if (issue.assigned_to && issue.assigned_to !== escalated_by) {
      recipientsSet.add(issue.assigned_to);
      console.log(`👤 Added original assignee: ${issue.assigned_to}`);
    }

    if (issue.reported_by && issue.reported_by !== escalated_by) {
      recipientsSet.add(issue.reported_by);
      console.log(`👤 Added original reporter: ${issue.reported_by}`);
    }

    // Convert to array and remove duplicates
    const recipientIds = Array.from(recipientsSet).filter(Boolean);
    console.log("🔔 Final escalation notification recipients:", recipientIds);

    // Fetch human-readable tier names
    const fromTierName = await getHierarchyNodeName(from_tier);
    const toTierName = to_tier
      ? await getHierarchyNodeName(to_tier)
      : "Root Level";

    // Create notifications for all recipients
    for (const recipient_id of recipientIds) {
      console.log(
        `📩 Creating escalation notification for recipient_id=${recipient_id}`
      );

      const notificationTitle =
        to_tier === null
          ? `🚨 Issue escalated from ${fromTierName} to: Quality Assurance Leader`
          : `Issue escalated: from ${fromTierName}`;

      const notificationBody =
        to_tier === null
          ? `Issue escalated from ${fromTierName} to root level (project managers). Reason: ${reason}`
          : `Issue escalated from ${fromTierName} to ${toTierName}. Reason: ${reason}`;

      await createNotification({
        recipient_id,
        user_id: escalated_by,
        reference_type: "escalation",
        reference_id: escalation_id,
        type: "issue_escalated",
        title: notificationTitle,
        body: notificationBody,
        payload: {
          issue_id,
          escalation_id,
          from_tier_id: from_tier,
          to_tier_id: to_tier,
          from_tier_name: fromTierName,
          to_tier_name: toTierName,
          reason,
          is_root_escalation: to_tier === null,
          project_id: issue.project_id,
        },
        transaction: t,
      });
    }

    // COMMIT ALL
    await t.commit();
    console.log("🟢 Escalation transaction committed successfully.");

    // In escalateIssue function - replace the email sending section:

    // After commit, send emails for the notifications created with better error handling
    (async () => {
      try {
        const notifications = await sequelize.models.Notification.findAll({
          where: {
            reference_id: escalation_id,
            type: "issue_escalated",
          },
          include: [
            {
              model: User,
              as: "recipient",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
        });

        console.log(
          `📧 Processing ${notifications.length} escalation email notifications`
        );

        const emailPromises = notifications.map(async (notification) => {
          try {
            console.log(
              `📧 Attempting email for notification ${notification.notification_id} to ${notification.recipient?.email}`
            );
            const result = await sendEmailForNotification(notification);

            if (result) {
              console.log(
                `✅ Email sent successfully for notification ${notification.notification_id}`
              );
              return {
                notification_id: notification.notification_id,
                status: "success",
              };
            } else {
              console.log(
                `❌ Email failed for notification ${notification.notification_id}`
              );
              return {
                notification_id: notification.notification_id,
                status: "failed",
                error: "sendEmailForNotification returned false",
              };
            }
          } catch (emailError) {
            console.error(
              `💥 Email error for notification ${notification.notification_id}:`,
              emailError.message
            );
            return {
              notification_id: notification.notification_id,
              status: "error",
              error: emailError.message,
            };
          }
        });

        const results = await Promise.allSettled(emailPromises);

        // Analyze results
        const successful = results.filter(
          (r) => r.status === "fulfilled" && r.value.status === "success"
        ).length;
        const failed = results.filter(
          (r) => r.status === "fulfilled" && r.value.status !== "success"
        ).length;
        const rejected = results.filter((r) => r.status === "rejected").length;

        console.log(
          `📧 Email sending summary: ${successful} successful, ${failed} failed, ${rejected} rejected`
        );
      } catch (err) {
        console.error("💥 Post-commit email processing error:", err);
      }
    })();

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

    // Add tier names alongside their IDs
    const response = {
      ...fullEscalation.toJSON(),
      from_tier_id: fullEscalation.from_tier,
      to_tier_id: fullEscalation.to_tier,
      from_tier_name: fromTierName,
      to_tier_name: toTierName,
    };

    return res.status(201).json(response);
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

// ------------------------------------------------------
module.exports = {
  escalateIssue,
  getEscalationsByIssueId,
  getEscalationHistoryByIssueId,
  getEscalationById,
  deleteEscalation,
};
