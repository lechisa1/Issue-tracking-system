const {
  Issue,
  IssueCategory,
  IssuePriority,
  User,
  Project,
  IssueAssignment,
  IssueTier,
  IssueEscalation,
  IssueComment,
  IssueAttachment,
  IssueAction,
  IssueStatusHistory,
} = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new issue
const createIssue = async (req, res) => {
  try {
    const {
      project_id,
      title,
      description,
      issue_category_id,
      priority_id,
      reported_by,
      current_tier,
      assigned_to,
    } = req.body;

    // Check if required fields are provided
    if (!project_id || !title || !description || !reported_by) {
      return res.status(400).json({
        message:
          "Project ID, title, description, and reported_by are required.",
      });
    }

    // Verify project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Verify reporter exists
    const reporter = await User.findByPk(reported_by);
    if (!reporter) {
      return res.status(404).json({ message: "Reporter user not found." });
    }

    // Verify category exists if provided
    if (issue_category_id) {
      const category = await IssueCategory.findByPk(issue_category_id);
      if (!category) {
        return res.status(404).json({ message: "Issue category not found." });
      }
    }

    // Verify priority exists if provided
    if (priority_id) {
      const priority = await IssuePriority.findByPk(priority_id);
      if (!priority) {
        return res.status(404).json({ message: "Issue priority not found." });
      }
    }

    // Verify assignee exists if provided
    if (assigned_to) {
      const assignee = await User.findByPk(assigned_to);
      if (!assignee) {
        return res.status(404).json({ message: "Assignee user not found." });
      }
    }

    const issue_id = uuidv4();

    // Create issue
    const issue = await Issue.create({
      issue_id,
      project_id,
      title,
      description,
      issue_category_id: issue_category_id || null,
      priority_id: priority_id || null,
      reported_by,
      current_tier: current_tier || "",
      assigned_to: assigned_to || null,
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create initial status history
    await IssueStatusHistory.create({
      status_history_id: uuidv4(),
      issue_id: issue.issue_id,
      from_status: null,
      to_status: "pending",
      changed_by: reported_by,
      reason: "Issue created",
      created_at: new Date(),
    });

    // Return issue with related data
    const issueWithDetails = await Issue.findOne({
      where: { issue_id: issue.issue_id },
      include: [
        { model: Project, as: "project" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
      ],
    });

    res.status(201).json(issueWithDetails);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all issues with filters
const getIssues = async (req, res) => {
  try {
    const {
      project_id,
      status,
      priority_id,
      category_id,
      assigned_to,
      reported_by,
    } = req.query;

    const whereClause = {};

    if (project_id) whereClause.project_id = project_id;
    if (status) whereClause.status = status;
    if (priority_id) whereClause.priority_id = priority_id;
    if (category_id) whereClause.issue_category_id = category_id;
    if (assigned_to) whereClause.assigned_to = assigned_to;
    if (reported_by) whereClause.reported_by = reported_by;

    const issues = await Issue.findAll({
      where: whereClause,
      include: [
        { model: Project, as: "project" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
        {
          model: IssueComment,
          as: "comments",
          include: [{ model: User, as: "author" }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(issues);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get issue by ID
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByPk(id, {
      include: [
        { model: Project, as: "project" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
        {
          model: IssueAssignment,
          as: "assignments",
          include: [
            { model: User, as: "assignee" },
            { model: User, as: "assigner" },
          ],
        },
        {
          model: IssueTier,
          as: "tiers",
          include: [{ model: User, as: "handler" }],
        },
        {
          model: IssueEscalation,
          as: "escalations",
          include: [{ model: User, as: "escalator" }],
        },
        {
          model: IssueComment,
          as: "comments",
          include: [{ model: User, as: "author" }],
        },
        {
          model: IssueAttachment,
          as: "attachments",
          include: [{ model: User, as: "uploader" }],
        },
        {
          model: IssueAction,
          as: "actions",
          include: [{ model: User, as: "performer" }],
        },
        {
          model: IssueStatusHistory,
          as: "statusHistory",
          include: [{ model: User, as: "changer" }],
        },
      ],
    });

    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.status(200).json(issue);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update issue
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      issue_category_id,
      priority_id,
      status,
      assigned_to,
      current_tier,
    } = req.body;

    const issue = await Issue.findByPk(id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Store old status for history
    const oldStatus = issue.status;

    // Update fields
    issue.title = title || issue.title;
    issue.description = description || issue.description;
    issue.issue_category_id = issue_category_id || issue.issue_category_id;
    issue.priority_id = priority_id || issue.priority_id;
    issue.assigned_to =
      assigned_to !== undefined ? assigned_to : issue.assigned_to;
    issue.current_tier = current_tier || issue.current_tier;

    // Handle status change and timestamps
    if (status && status !== issue.status) {
      issue.status = status;

      // Update resolved_at if status is resolved
      if (status === "resolved" && oldStatus !== "resolved") {
        issue.resolved_at = new Date();
      }

      // Update closed_at if status is closed
      if (status === "closed" && oldStatus !== "closed") {
        issue.closed_at = new Date();
      }

      // Create status history record
      await IssueStatusHistory.create({
        status_history_id: uuidv4(),
        issue_id: issue.issue_id,
        from_status: oldStatus,
        to_status: status,
        changed_by: req.user?.user_id || issue.reported_by, // Assuming user ID from auth middleware
        reason: req.body.status_change_reason || "Status updated",
        created_at: new Date(),
      });
    }

    issue.updated_at = new Date();
    await issue.save();

    // Return updated issue with relations
    const updatedIssue = await Issue.findByPk(id, {
      include: [
        { model: Project, as: "project" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
      ],
    });

    res.status(200).json(updatedIssue);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete issue
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByPk(id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    await issue.destroy();
    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
};
