const {
  IssueAssignment,
  Issue,
  User,
  AssignmentAttachment,
  IssueHistory,
  Attachment,
  IssueAction,
  sequelize,
} = require("../../models");
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

    const assignment_id = uuidv4();

    // 4. Create assignment
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

    // 5. Attach files if provided
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
    // 8. CREATE IssueHistory ENTRY (NEW)
    // ==================================
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id,
        user_id: resolved_by,
        action: "assigned",
        status_at_time: "resolved",
        escalation_id: null,
        resolution_id,
        notes: `Issue resolved. Reason: ${reason}`,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // COMMIT transaction
    await t.commit();

    // 8. Fetch full assignment with attachments
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

    return res.status(201).json(assignmentWithDetails);
  } catch (error) {
    await t.rollback();
    console.error("ASSIGNMENT ERROR:", error);
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
//  UPDATE ASSIGNMENT STATUS
// ------------------------------------------------------
const updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const assignment = await IssueAssignment.findByPk(id);
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    assignment.status = status || assignment.status;
    assignment.remarks = remarks !== undefined ? remarks : assignment.remarks;
    assignment.updated_at = new Date();

    await assignment.save();

    // Return updated assignment with attachments
    const updatedAssignment = await IssueAssignment.findOne({
      where: { assignment_id: id },
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

module.exports = {
  assignIssue,
  getAssignmentsByIssueId,
  updateAssignmentStatus,
};
