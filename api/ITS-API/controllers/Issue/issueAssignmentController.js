const { IssueAssignment, Issue, User } = require("../../models");
const { v4: uuidv4 } = require("uuid");

// Assign issue to developer
const assignIssue = async (req, res) => {
  try {
    const { issue_id, assignee_id, assigned_by, remarks } = req.body;

    // Verify issue exists
    const issue = await Issue.findByPk(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // Verify assignee exists
    const assignee = await User.findByPk(assignee_id);
    if (!assignee) {
      return res.status(404).json({ message: "Assignee user not found." });
    }

    // Verify assigner exists
    const assigner = await User.findByPk(assigned_by);
    if (!assigner) {
      return res.status(404).json({ message: "Assigner user not found." });
    }

    const assignment_id = uuidv4();

    // Create assignment
    const assignment = await IssueAssignment.create({
      assignment_id,
      issue_id,
      assignee_id,
      assigned_by,
      assigned_at: new Date(),
      status: "pending",
      remarks: remarks || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Update issue's current assignee
    await Issue.update(
      { assigned_to: assignee_id, updated_at: new Date() },
      { where: { issue_id } }
    );

    // Create action record
    await IssueAction.create({
      action_id: uuidv4(),
      issue_id,
      action_name: "Assigned to Developer",
      action_description: `Issue assigned to ${assignee.full_name}`,
      performed_by: assigned_by,
      related_tier: "Developer",
      created_at: new Date(),
    });

    // Return assignment with relations
    const assignmentWithDetails = await IssueAssignment.findOne({
      where: { assignment_id: assignment.assignment_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
      ],
    });

    res.status(201).json(assignmentWithDetails);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get assignments by issue ID
const getAssignmentsByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const assignments = await IssueAssignment.findAll({
      where: { issue_id },
      include: [
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
      ],
      order: [["assigned_at", "DESC"]],
    });

    res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update assignment status
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

    res.status(200).json(assignment);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  assignIssue,
  getAssignmentsByIssueId,
  updateAssignmentStatus,
};
