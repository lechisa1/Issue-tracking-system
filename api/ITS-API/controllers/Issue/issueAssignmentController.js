const {
  IssueAssignment,
  Issue,
  User,
  AssignmentAttachment,
  IssueHistory,
  Attachment,
  IssueAction,
  IssueStatusHistory,
  IssueResolution,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");
const {
  createNotification,
  sendEmailForNotification,
} = require("../../services/notificationService");
const { v4: uuidv4 } = require("uuid");

// ------------------------------------------------------
//  ASSIGN ISSUE
// ------------------------------------------------------
const assignIssue = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id, assignee_id, assigned_by, remarks, attachment_ids } =
      req.body;

    // 1. Validate Issue
    const issue = await Issue.findByPk(issue_id, { transaction: t });
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    // 2. Validate assignee
    const assignee = await User.findByPk(assignee_id, { transaction: t });
    if (!assignee)
      return res.status(404).json({ message: "Assignee user not found." });

    // 3. Validate assigner
    const assigner = await User.findByPk(assigned_by, { transaction: t });
    if (!assigner)
      return res.status(404).json({ message: "Assigner user not found." });

    const existingAssignment = await IssueAssignment.findOne({
      where: { issue_id, assignee_id },
      transaction: t,
    });

    if (existingAssignment) {
      return res.status(409).json({
        message: `This user is already assigned to the issue.`,
        assignment_id: existingAssignment.assignment_id,
      });
    }

    const assignment_id = uuidv4();

    // 5. Create assignment
    const assignment = await IssueAssignment.create(
      {
        assignment_id,
        issue_id,
        assignee_id,
        assigned_by,
        assigned_at: new Date(),
        status: "pending",
        remarks: remarks || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    // 6. Attach files if provided
    if (attachment_ids?.length > 0) {
      const attachments = attachment_ids.map((attachment_id) => ({
        assignment_id,
        attachment_id,
        created_at: new Date(),
      }));

      await AssignmentAttachment.bulkCreate(attachments, { transaction: t });
    }

    // 7. Log action
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "Assigned to Developer",
        action_description: `Issue assigned to ${assignee.full_name}`,
        performed_by: assigned_by,
        related_tier: "Developer",
        created_at: new Date(),
      },
      { transaction: t }
    );

    // ==================================
    // 8. CREATE IssueHistory ENTRY
    // ==================================
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id,
        user_id: assigned_by,
        action: "assigned",
        status_at_time: "pending",
        assignment_id: assignment_id,
        escalation_id: null,
        resolution_id: null,
        notes: `Issue assigned to ${assignee.full_name}. ${
          remarks ? `Remarks: ${remarks}` : ""
        }`,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 9. Update issue status if needed
    await issue.update(
      {
        status: "pending",
        updated_at: new Date(),
      },
      { transaction: t }
    );

    // ==================================
    // 10. NOTIFICATION LOGIC (CONFIDENTIAL)
    // ==================================
    const recipientsSet = new Set();

    // A. Always notify the assignee (the user being assigned to the issue)
    if (assignee_id && assignee_id !== assigned_by) {
      recipientsSet.add(assignee_id);
      console.log(
        `👤 Notifying assignee: ${assignee_id} (${assignee.full_name})`
      );
    }

    // D. Notify the previous assignee (if any) for handover context
    const previousAssignment = await IssueAssignment.findOne({
      where: {
        issue_id: issue_id,
        assignee_id: { [Op.ne]: assignee_id }, // Not the current assignee
      },
      order: [["assigned_at", "DESC"]],
      transaction: t,
    });

    if (previousAssignment && previousAssignment.assignee_id !== assigned_by) {
      recipientsSet.add(previousAssignment.assignee_id);
      console.log(
        `👤 Notifying previous assignee: ${previousAssignment.assignee_id}`
      );
    }

    // Convert to array and remove duplicates
    const recipientIds = Array.from(recipientsSet).filter(Boolean);
    console.log(`Final assignment notification recipients:`, recipientIds);

    // Create notifications for all recipients
    for (const recipient_id of recipientIds) {
      console.log(
        `Creating assignment notification for recipient_id=${recipient_id}`
      );

      await createNotification({
        recipient_id,
        user_id: assigned_by,
        reference_type: "assignment",
        reference_id: assignment_id,
        type: "issue_assigned",
        title: `New Task Assigned: ${`Issue #${issue.ticket_number}`}`,
        body: `A new task "${
          issue.ticket_number
        }" has been assigned to you by ${assigner.full_name}. ${
          remarks ? `Remarks: ${remarks}` : "Let Me know if you have questions."
        }`,
        payload: {
          issue_id,
          assignment_id,
          assignee_id,
          assignee_name: assignee.full_name,
          assigner_id: assigned_by,
          assigner_name: assigner.full_name,
          remarks: remarks || null,
          project_id: issue.project_id,

          ticket_number: issue.ticket_number,
        },
        transaction: t,
      });
    }

    // ==================================
    // 11. COMMIT TRANSACTION
    // ==================================
    await t.commit();
    console.log("🟢 Assignment transaction committed successfully.");

    // ==================================
    // 12. ASYNC EMAIL SENDING
    // ==================================
    (async () => {
      try {
        const notifications = await sequelize.models.Notification.findAll({
          where: {
            reference_id: assignment_id,
            type: "issue_assigned",
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
          `📧 Processing ${notifications.length} assignment email notifications`
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

    // ==================================
    // 13. RETURN ASSIGNMENT WITH DETAILS
    // ==================================
    const assignmentWithDetails = await IssueAssignment.findOne({
      where: { assignment_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
        {
          model: AssignmentAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Issue assigned successfully",
      data: assignmentWithDetails,
      notifications_sent: recipientIds.length,
      confidential: true, // Indicate this is a confidential assignment
    });
  } catch (error) {
    await t.rollback();
    console.error("ASSIGNMENT ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  REMOVE ASSIGNMENT
// ------------------------------------------------------
const removeAssignment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { assignment_id } = req.params;
    const removed_by = req.user.user_id;
    const { reason } = req.body;

    // 1. Validate assignment exists
    const assignment = await IssueAssignment.findOne({
      where: { assignment_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
      ],
      transaction: t,
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // 2. Validate user who is removing the assignment
    const removedByUser = await User.findByPk(removed_by, { transaction: t });
    if (!removedByUser) {
      return res
        .status(404)
        .json({ message: "User removing assignment not found" });
    }

    // 3. Store assignment details for history before deletion
    const { issue_id, assignee_id, assignee, assigner } = assignment;

    // 4. Delete assignment attachments first (due to foreign key constraints)
    await AssignmentAttachment.destroy({
      where: { assignment_id },
      transaction: t,
    });

    // 5. Delete the assignment
    await IssueAssignment.destroy({
      where: { assignment_id },
      transaction: t,
    });

    // 6. Log action
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "Assignment Removed",
        action_description: `Assignment removed for ${assignee.full_name}`,
        performed_by: removed_by,
        related_tier: "Developer",
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 7. Create IssueHistory entry
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id,
        user_id: removed_by,
        action: "unassigned", // New action type for removal
        status_at_time: assignment.issue.status, // Current issue status
        assignment_id: null, // Since we're removing the assignment
        escalation_id: null,
        resolution_id: null,
        notes: `Assignment removed for ${assignee.full_name}. ${
          reason ? `Reason: ${reason}` : "No reason provided"
        }`,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // COMMIT transaction
    await t.commit();

    return res.status(200).json({
      message: "Assignment removed successfully",
      removed_assignment: {
        assignment_id,
        issue_id,
        assignee_name: assignee.full_name,
        assigner_name: assigner.full_name,
        removed_by: removedByUser.full_name,
        reason,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("REMOVE ASSIGNMENT ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  REMOVE ASSIGNMENT BY ASSIGNEE AND ISSUE
// ------------------------------------------------------
const removeAssignmentByAssigneeAndIssue = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id, assignee_id } = req.params;
    const removed_by = req.user.user_id;
    const { reason } = req.body;

    // 1. Validate issue exists
    const issue = await Issue.findByPk(issue_id, { transaction: t });
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // 2. Validate assignee exists
    const assignee = await User.findByPk(assignee_id, { transaction: t });
    if (!assignee) {
      return res.status(404).json({ message: "Assignee user not found" });
    }

    // 3. Validate user who is removing the assignment
    const removedByUser = await User.findByPk(removed_by, { transaction: t });
    if (!removedByUser) {
      return res
        .status(404)
        .json({ message: "User removing assignment not found" });
    }

    // 4. Find the assignment by issue_id and assignee_id
    const assignment = await IssueAssignment.findOne({
      where: {
        issue_id,
        assignee_id,
      },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
      ],
      transaction: t,
    });

    if (!assignment) {
      return res.status(404).json({
        message: `No assignment found for user ${assignee.full_name} on this issue`,
      });
    }

    const assignment_id = assignment.assignment_id;

    // 5. Delete assignment attachments first (due to foreign key constraints)
    await AssignmentAttachment.destroy({
      where: { assignment_id },
      transaction: t,
    });

    // 6. Delete the assignment
    await IssueAssignment.destroy({
      where: { assignment_id },
      transaction: t,
    });

    // 7. Log action
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "Assignment Removed by Assignee",
        action_description: `Assignment removed for ${assignee.full_name}`,
        performed_by: removed_by,
        related_tier: "Developer",
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 8. Create IssueHistory entry
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id,
        user_id: removed_by,
        action: "unassigned",
        status_at_time: issue.status, // Current issue status
        assignment_id: null,
        escalation_id: null,
        resolution_id: null,
        notes: `Assignment removed for ${assignee.full_name}. ${
          reason ? `Reason: ${reason}` : "No reason provided"
        }`,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // COMMIT transaction
    await t.commit();

    return res.status(200).json({
      message: "Assignment removed successfully",
      removed_assignment: {
        assignment_id,
        issue_id,
        assignee_id,
        assignee_name: assignee.full_name,
        assigner_name: assignment.assigner.full_name,
        removed_by: removedByUser.full_name,
        reason,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("REMOVE ASSIGNMENT BY ASSIGNEE ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
// ------------------------------------------------------
//  GET ASSIGNMENTS BY ISSUE ID
// ------------------------------------------------------
const getAssignmentsByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const assignments = await IssueAssignment.findAll({
      where: { issue_id },
      include: [
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
        {
          model: AssignmentAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
      order: [["assigned_at", "DESC"]],
    });

    return res.status(200).json(assignments);
  } catch (error) {
    console.error("FETCH ASSIGNMENTS ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  GET ASSIGNMENT BY ID
// ------------------------------------------------------
const getAssignmentById = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    const assignment = await IssueAssignment.findOne({
      where: { assignment_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
        {
          model: AssignmentAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    console.error("FETCH ASSIGNMENT ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  GET LATEST ASSIGNMENT BY ISSUE ID
// ------------------------------------------------------
const getLatestAssignmentByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const assignment = await IssueAssignment.findOne({
      where: { issue_id },
      include: [
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
        {
          model: AssignmentAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
      order: [["assigned_at", "DESC"]],
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ message: "No assignment found for this issue" });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    console.error("FETCH LATEST ASSIGNMENT ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  GET ASSIGNMENTS BY USER ID
// ------------------------------------------------------
const getAssignmentsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const assignments = await IssueAssignment.findAll({
      where: { assignee_id: user_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assigner" },
        {
          model: AssignmentAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
      order: [["assigned_at", "DESC"]],
    });

    return res.status(200).json(assignments);
  } catch (error) {
    console.error("FETCH USER ASSIGNMENTS ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  UPDATE ASSIGNMENT STATUS
// ------------------------------------------------------
const updateAssignmentStatus = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const { status, remarks } = req.body;

    const assignment = await IssueAssignment.findByPk(assignment_id);
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    assignment.status = status || assignment.status;
    assignment.remarks = remarks !== undefined ? remarks : assignment.remarks;
    assignment.updated_at = new Date();

    await assignment.save();

    // Return updated assignment with attachments
    const updatedAssignment = await IssueAssignment.findOne({
      where: { assignment_id },
      include: [
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
        {
          model: AssignmentAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
    });

    return res.status(200).json(updatedAssignment);
  } catch (error) {
    console.error("UPDATE ASSIGNMENT ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const acceptAssignment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { assignment_id } = req.body;
    const accepted_by = req.user?.user_id;

    // 1. Get assignment
    const assignment = await IssueAssignment.findOne({
      where: {
        assignment_id,
        assignee_id: accepted_by,
        assignment_status: "pending", // Can only accept if pending
      },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assigner" },
      ],
      transaction: t,
    });

    if (!assignment) {
      await t.rollback();
      return res.status(404).json({
        message: "Assignment not found, already accepted, or unauthorized.",
      });
    }

    // 2. Update assignment status
    await assignment.update(
      {
        assignment_status: "accepted",
      },
      { transaction: t }
    );

    // 3. Create history
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id: assignment.issue_id,
        user_id: accepted_by,
        action: "accepted_assignment",
        status_at_time: assignment.issue.status,
        assignment_id,
        notes: `${assignment.role_type} assignment accepted by ${req.user.full_name}`,
      },
      { transaction: t }
    );

    // 4. Notify assigner
    await createNotification({
      recipient_id: assignment.assigned_by,
      user_id: accepted_by,
      reference_type: "assignment",
      reference_id: assignment_id,
      type: "assignment_accepted",
      title: `Assignment Accepted: ${assignment.issue.ticket_number}`,
      body: `${req.user.full_name} has accepted the ${assignment.role_type} assignment.`,
      payload: {
        issue_id: assignment.issue_id,
        assignment_id,
        role_type: assignment.role_type,
        assignee_id: assignment.assignee_id,
        ticket_number: assignment.issue.ticket_number,
      },
      transaction: t,
    });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Assignment accepted successfully",
      data: assignment,
    });
  } catch (error) {
    await t.rollback();
    console.error("ACCEPTANCE ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const resolveAssignment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { assignment_id, resolution_remarks, attachment_ids } = req.body;
    const resolved_by = req.user?.user_id;

    // 1. Get assignment
    const assignment = await IssueAssignment.findOne({
      where: {
        assignment_id,
        assignee_id: resolved_by,
        assignment_status: "accepted", // Can only resolve if in progress
      },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assigner" },
      ],
      transaction: t,
    });

    if (!assignment) {
      await t.rollback();
      return res.status(404).json({
        message: "Assignment not found, not in progress, or unauthorized.",
      });
    }

    // 2. Update assignment status
    await assignment.update(
      {
        assignment_status: "resolved",

        resolution_remarks: resolution_remarks || null,
      },
      { transaction: t }
    );

    // 3. Add resolution attachments if any
    if (attachment_ids?.length > 0) {
      const attachments = attachment_ids.map((attachment_id) => ({
        assignment_id,
        attachment_id,
        attachment_type: "resolution",
        created_at: new Date(),
      }));
      await AssignmentAttachment.bulkCreate(attachments, { transaction: t });
    }

    // 4. Create history
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id: assignment.issue_id,
        user_id: resolved_by,
        action: "resolved_assignment",
        status_at_time: assignment.issue.status,
        assignment_id,
        notes: `${assignment.role_type} part resolved by ${
          req.user.full_name
        }. ${resolution_remarks ? `Remarks: ${resolution_remarks}` : ""}`,
      },
      { transaction: t }
    );

    // 5. Notify assigner
    await createNotification({
      recipient_id: assignment.assigned_by,
      user_id: resolved_by,
      reference_type: "assignment",
      reference_id: assignment_id,
      type: "assignment_resolved",
      title: `Assignment Resolved: ${assignment.issue.ticket_number}`,
      body: `${req.user.full_name} has resolved their ${assignment.role_type} part. Please review and confirm.`,
      payload: {
        issue_id: assignment.issue_id,
        assignment_id,
        role_type: assignment.role_type,
        assignee_id: assignment.assignee_id,
        ticket_number: assignment.issue.ticket_number,
        resolution_remarks,
      },
      transaction: t,
    });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Assignment resolved successfully",
      data: assignment,
    });
  } catch (error) {
    await t.rollback();
    console.error("RESOLUTION ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
const confirmAssignmentResolution = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { assignment_id, confirmation_remarks } = req.body;
    const confirmed_by = req.user?.user_id;

    // 1. Get assignment
    const assignment = await IssueAssignment.findOne({
      where: {
        assignment_id,
        assigned_by: confirmed_by, // Only original assigner can confirm
        assignment_status: "resolved", // Can only confirm if resolved
      },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assignee" },
      ],
      transaction: t,
    });

    if (!assignment) {
      await t.rollback();
      return res.status(404).json({
        message:
          "Assignment not found, not resolved yet, or unauthorized to confirm.",
      });
    }

    // 2. Update assignment status to confirmed
    await assignment.update(
      {
        assignment_status: "confirmed",
        confirmed_at: new Date(),
        confirmation_remarks: confirmation_remarks || null,
      },
      { transaction: t }
    );

    // 3. Create confirmation history
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id: assignment.issue_id,
        user_id: confirmed_by,
        action: "confirmed_resolution",
        status_at_time: assignment.issue.status,
        assignment_id,
        notes: `${assignment.role_type} resolution confirmed by ${
          req.user.full_name
        }. ${confirmation_remarks ? `Remarks: ${confirmation_remarks}` : ""}`,
      },
      { transaction: t }
    );

    // 4. Notify assignee
    await createNotification({
      recipient_id: assignment.assignee_id,
      user_id: confirmed_by,
      reference_type: "assignment",
      reference_id: assignment_id,
      type: "resolution_confirmed",
      title: `Resolution Confirmed: ${assignment.issue.ticket_number}`,
      body: `Your ${assignment.role_type} resolution has been confirmed by ${req.user.full_name}.`,
      payload: {
        issue_id: assignment.issue_id,
        assignment_id,
        role_type: assignment.role_type,
        ticket_number: assignment.issue.ticket_number,
        confirmation_remarks,
      },
      transaction: t,
    });

    // 5. Check if ALL assignments are confirmed
    const allAssignments = await IssueAssignment.findAll({
      where: {
        issue_id: assignment.issue_id,
        assignment_status: { [Op.ne]: "pending" }, // Exclude pending assignments
      },
      transaction: t,
    });

    const activeAssignments = allAssignments.filter((a) =>
      ["accepted", "resolved", "confirmed"].includes(a.assignment_status)
    );

    const allConfirmed =
      activeAssignments.length > 0 &&
      activeAssignments.every((a) => a.assignment_status === "confirmed");

    // 6. Update issue status based on confirmation status
    if (allConfirmed) {
      // All assignments are confirmed → Issue is fully resolved
      await assignment.issue.update(
        {
          status: "resolved",

          updated_at: new Date(),
        },
        { transaction: t }
      );

      // Create resolution entry
      await IssueResolution.create(
        {
          resolution_id: uuidv4(),
          issue_id: assignment.issue_id,
          resolved_by: confirmed_by,
          resolution_type: "assigned_development",
          notes: "All assigned development parts completed and confirmed",
        },
        { transaction: t }
      );

      // Create status history
      await IssueStatusHistory.create(
        {
          status_history_id: uuidv4(),
          issue_id: assignment.issue_id,
          from_status: assignment.issue.status,
          to_status: "resolved",
          changed_by: confirmed_by,
          reason: "All assigned parts confirmed",
        },
        { transaction: t }
      );

      // Notify all involved users
      const involvedUsers = [
        assignment.issue.reported_by,
        ...activeAssignments.map((a) => a.assignee_id),
        ...activeAssignments.map((a) => a.assigned_by),
      ].filter((value, index, self) => self.indexOf(value) === index);

      for (const userId of involvedUsers) {
        if (userId !== confirmed_by) {
          await createNotification({
            recipient_id: userId,
            user_id: confirmed_by,
            reference_type: "issue",
            reference_id: assignment.issue_id,
            type: "issue_resolved",
            title: `Issue Resolved: ${assignment.issue.ticket_number}`,
            body: `Issue ${assignment.issue.ticket_number} has been resolved as all assigned parts are confirmed.`,
            payload: {
              issue_id: assignment.issue_id,
              ticket_number: assignment.issue.ticket_number,
            },
            transaction: t,
          });
        }
      }
    } else {
      // Some assignments still pending → Update issue status accordingly
      const hasInProgress = activeAssignments.some(
        (a) => a.assignment_status === "in_progress"
      );
      const hasResolved = activeAssignments.some(
        (a) => a.assignment_status === "resolved"
      );

      let newIssueStatus = assignment.issue.status;

      if (hasInProgress) {
        newIssueStatus = "in_progress";
      } else if (hasResolved && !hasInProgress) {
        newIssueStatus = "pending_review"; // Custom status for partial completion
      }

      if (newIssueStatus !== assignment.issue.status) {
        await assignment.issue.update(
          {
            status: newIssueStatus,
            updated_at: new Date(),
          },
          { transaction: t }
        );

        await IssueStatusHistory.create(
          {
            status_history_id: uuidv4(),
            issue_id: assignment.issue_id,
            from_status: assignment.issue.status,
            to_status: newIssueStatus,
            changed_by: confirmed_by,
            reason: `Partial assignment confirmed. Status: ${assignment.role_type} confirmed`,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: `${assignment.role_type} resolution confirmed successfully`,
      data: {
        assignment,
        issue_status: assignment.issue.status,
        all_assignments_confirmed: allConfirmed,
        confirmation_summary: {
          total_active_assignments: activeAssignments.length,
          confirmed: activeAssignments.filter(
            (a) => a.assignment_status === "confirmed"
          ).length,
          resolved: activeAssignments.filter(
            (a) => a.assignment_status === "resolved"
          ).length,
          in_progress: activeAssignments.filter(
            (a) => a.assignment_status === "in_progress"
          ).length,
          accepted: activeAssignments.filter(
            (a) => a.assignment_status === "accepted"
          ).length,
        },
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("CONFIRMATION ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
const transferAssignment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { assignment_id, new_assignee_id, notes } = req.body;
    const user_id = req.user.user_id; // logged-in user

    // 1️⃣ Fetch current assignment
    const assignment = await IssueAssignment.findByPk(assignment_id, {
      transaction: t,
    });
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    // 2️⃣ Check if logged-in user is current assignee
    if (assignment.assignee_id !== user_id) {
      return res.status(403).json({
        message: "Only the current assignee can transfer this assignment",
      });
    }

    // 3️⃣ Validate new assignee
    const newAssignee = await User.findByPk(new_assignee_id, {
      transaction: t,
    });
    if (!newAssignee)
      return res.status(404).json({ message: "New assignee not found" });

    // 4️⃣ Update assignment
    const oldAssigneeId = assignment.assignee_id;
    await assignment.update(
      {
        assignee_id: new_assignee_id,
        updated_at: new Date(),
        remarks: notes || `Transferred from user ${oldAssigneeId}`,
      },
      { transaction: t }
    );

    // 5️⃣ Create IssueHistory entry
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id: assignment.issue_id,
        user_id: user_id,
        action: "transfer",
        status_at_time: assignment.status,
        assignment_id: assignment.assignment_id,
        notes: notes || `Assignment transferred to ${newAssignee.full_name}`,
      },
      { transaction: t }
    );

    // 6️⃣ Notify new assignee
    await createNotification({
      recipient_id: new_assignee_id,
      user_id,
      reference_type: "assignment",
      reference_id: assignment.assignment_id,
      type: "assignment_transferred",
      title: `Assignment Transferred: Issue #${assignment.issue.ticket_number}`,
      body: `${req.user.full_name} transferred this assignment to you.`,
      payload: {
        issue_id: assignment.issue_id,
        assignment_id: assignment.assignment_id,
        old_assignee_id: oldAssigneeId,
        new_assignee_id,
      },
      transaction: t,
    });

    // 7️⃣ Commit
    await t.commit();

    // 8️⃣ Return updated assignment
    const updatedAssignment = await IssueAssignment.findByPk(assignment_id, {
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
        {
          model: AssignmentAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Assignment transferred successfully",
      data: updatedAssignment,
    });
  } catch (error) {
    await t.rollback();
    console.error("TRANSFER ERROR:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports = {
  assignIssue,
  removeAssignment,
  removeAssignmentByAssigneeAndIssue,
  getAssignmentsByIssueId,
  getAssignmentById,
  getLatestAssignmentByIssueId,
  getAssignmentsByUserId,
  updateAssignmentStatus,
  acceptAssignment,

  resolveAssignment,
  confirmAssignmentResolution,
  transferAssignment,
};
