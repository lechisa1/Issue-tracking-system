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
  sequelize 
} = require("../../models");
const { v4: uuidv4 } = require("uuid");

// Create a new issue
const createIssue = async (req, res) => {
  const t = await sequelize.transaction(); // start a transaction
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

    if (!project_id || !title || !description || !reported_by) {
      return res.status(400).json({
        message:
          "Project ID, title, description, and reported_by are required.",
      });
    }

    const project = await Project.findByPk(project_id, { transaction: t });
    if (!project) throw new Error("Project not found.");

    const reporter = await User.findByPk(reported_by, { transaction: t });
    if (!reporter) throw new Error("Reporter user not found.");

    if (issue_category_id) {
      const category = await IssueCategory.findByPk(issue_category_id, { transaction: t });
      if (!category) throw new Error("Issue category not found.");
    }

    if (priority_id) {
      const priority = await IssuePriority.findByPk(priority_id, { transaction: t });
      if (!priority) throw new Error("Issue priority not found.");
    }

    if (assigned_to) {
      const assignee = await User.findByPk(assigned_to, { transaction: t });
      if (!assignee) throw new Error("Assignee user not found.");
    }

    const issue_id = uuidv4();

    // Create the issue
    const issue = await Issue.create(
      {
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
      },
      { transaction: t }
    );

    // Create initial status history
    await IssueStatusHistory.create(
      {
        status_history_id: uuidv4(),
        issue_id: issue.issue_id,
        from_status: "pending",
        to_status: "pending",
        changed_by: reported_by,
        reason: "Issue created",
        created_at: new Date(),
      },
      { transaction: t }
    );

    // Commit transaction
    await t.commit();

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
    await t.rollback(); // rollback if anything fails
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
  const t = await sequelize.transaction(); // start transaction
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
      status_change_reason,
    } = req.body;

    const issue = await Issue.findByPk(id, { transaction: t });
    if (!issue) {
      await t.rollback();
      return res.status(404).json({ message: "Issue not found" });
    }

    const oldStatus = issue.status;

    // Update fields
    issue.title = title || issue.title;
    issue.description = description || issue.description;
    issue.issue_category_id = issue_category_id || issue.issue_category_id;
    issue.priority_id = priority_id || issue.priority_id;
    issue.assigned_to = assigned_to !== undefined ? assigned_to : issue.assigned_to;
    issue.current_tier = current_tier || issue.current_tier;

    // Handle status change
    if (status && status !== issue.status) {
      issue.status = status;

      if (status === "resolved" && oldStatus !== "resolved") {
        issue.resolved_at = new Date();
      }

      if (status === "closed" && oldStatus !== "closed") {
        issue.closed_at = new Date();
      }

      // Create status history
      await IssueStatusHistory.create(
        {
          status_history_id: uuidv4(),
          issue_id: issue.issue_id,
          from_status: oldStatus,
          to_status: status,
          changed_by: req.user?.user_id || issue.reported_by,
          reason: status_change_reason || "Status updated",
          created_at: new Date(),
        },
        { transaction: t }
      );
    }

    issue.updated_at = new Date();
    await issue.save({ transaction: t });

    await t.commit(); // commit transaction if all succeeds

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
    await t.rollback(); // rollback on any failure
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
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
