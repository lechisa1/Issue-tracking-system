const {
  Issue,
  IssueCategory,
  IssuePriority,
  User,
  InstituteProject,
  HierarchyNode,
  IssueAssignment,
  IssueTier,
  IssueEscalation,
  IssueComment,
  ProjectUserRole,
  Institute,
  Project,
  IssueAttachment,
  IssueAction,
  IssueStatusHistory,
  sequelize,
} = require("../../models");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
// ✅ Create a new issue

const createIssue = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      institute_project_id,
      title,
      description,
      issue_category_id,
      hierarchy_node_id,
      priority_id,
      reported_by,
      assigned_to,
      action_taken,
      url_path,
      issue_description,
      issue_occured_time,
    } = req.body;

    const issue_id = uuidv4();

    const issue = await Issue.create(
      {
        issue_id,
        institute_project_id: institute_project_id || null,
        title,
        description,
        issue_category_id: issue_category_id || null,
        hierarchy_node_id: hierarchy_node_id || null,
        priority_id: priority_id || null,
        reported_by,
        assigned_to: assigned_to || null,
        action_taken: action_taken || null,
        url_path: url_path || null,
        issue_description: issue_description || null,
        issue_occured_time: issue_occured_time || null,
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

    await t.commit();

    // Return full issue details
    const issueWithDetails = await Issue.findOne({
      where: { issue_id: issue.issue_id },
      include: [
        { model: InstituteProject, as: "instituteProject" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: HierarchyNode, as: "hierarchyNode" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
      ],
    });

    res.status(201).json(issueWithDetails);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
const createIssueWithAttachments = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      institute_project_id,
      title,
      description,
      issue_category_id,
      hierarchy_node_id,
      priority_id,
      action_taken,
      url_path,
      issue_description,
      issue_occured_time,
      replace = false,
    } = req.body;

    const reported_by = req.user?.user_id;
    if (!reported_by) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    if (!title || title.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    console.log("REQ BODY institute_project_id =", institute_project_id);

    // ✅ Fetch user's assigned projects
    const assignedProjects = await ProjectUserRole.findAll({
      where: { user_id: reported_by, is_active: true },
      include: [
        {
          model: Project,
          as: "project",
          include: [
            {
              model: InstituteProject,
              as: "instituteProjects",
              attributes: ["institute_project_id"],
            },
          ],
        },
      ],
      transaction: t,
    });

    // Filter out invalid projects
    const validAssignments = assignedProjects.filter(
      (assignment) =>
        assignment.project && assignment.project.instituteProjects?.length
    );

    // ✅ Check if user is assigned to the selected institute_project safely
    const isAssigned = assignedProjects.some((assignment) =>
      assignment.project?.instituteProjects?.some(
        (ip) => ip.institute_project_id === institute_project_id
      )
    );

    if (!isAssigned) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this project",
      });
    }

    // 1️⃣ Create the issue inside transaction
    const issue_id = uuidv4();
    const issue = await Issue.create(
      {
        issue_id,
        institute_project_id,
        title: title.trim(),
        description,
        issue_category_id: issue_category_id || null,
        hierarchy_node_id: hierarchy_node_id || null,
        priority_id: priority_id || null,
        reported_by,
        assigned_to: null,
        action_taken: action_taken || null,
        url_path: url_path || null,
        issue_description: issue_description || null,
        issue_occured_time: issue_occured_time || null,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    // 2️⃣ Create initial status history
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

    // 3️⃣ Handle attachments
    if (req.files && req.files.length > 0) {
      const issueDir = path.join(
        __dirname,
        `../public/uploads/issues/${issue_id}`
      );
      if (!fs.existsSync(issueDir)) fs.mkdirSync(issueDir, { recursive: true });

      if (replace) {
        const existingFiles = await IssueAttachment.findAll({
          where: { issue_id },
          transaction: t,
        });
        for (const file of existingFiles) {
          if (fs.existsSync(file.file_path)) fs.unlinkSync(file.file_path);
          await file.destroy({ transaction: t });
        }
      }

      for (const file of req.files) {
        const newFilePath = path.join(issueDir, file.filename);
        fs.renameSync(file.path, newFilePath);

        await IssueAttachment.create(
          {
            attachment_id: uuidv4(),
            issue_id,
            file_name: file.filename,
            file_path: newFilePath,
            uploaded_by: reported_by,
            created_at: new Date(),
            updated_at: new Date(),
          },
          { transaction: t }
        );
      }
    }

    // ✅ Commit transaction after all creations
    await t.commit();

    // 4️⃣ Fetch issue with minimal details (outside transaction)
    const issueWithDetails = await Issue.findOne({
      where: { issue_id },
      include: [
        {
          model: IssueAttachment,
          as: "attachments",
          attributes: ["file_name", "file_path"],
        },
        { model: User, as: "reporter", attributes: ["user_id", "full_name"] },
        {
          model: InstituteProject,
          as: "instituteProject",
          attributes: ["institute_project_id"],
          include: [
            {
              model: Project,
              as: "project",
              attributes: ["project_id", "name"],
            },
            {
              model: Institute,
              as: "institute",
              attributes: ["institute_id", "name"],
            },
          ],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: issueWithDetails,
    });
  } catch (error) {
    try {
      await t.rollback();
    } catch (_) {}

    // Clean up uploaded files if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    console.error("❌ Error creating issue:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating issue",
      error: error.message,
    });
  }
};

const updateIssueWithAttachments = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const issue_id = req.params.issue_id;
    const reported_by = req.user?.user_id;

    console.log("=== CONTROLLER DEBUG ===");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("Request params:", req.params);
    console.log("=== END DEBUG ===");

    const {
      title,
      description,
      issue_category_id,
      hierarchy_node_id,
      priority_id,
      action_taken,
      url_path,
      issue_description,
      issue_occured_time,
      replace = "false",
    } = req.body;

    console.log("📝 PARSED FIELDS:");
    console.log("Title:", title, "(type:", typeof title, ")");
    console.log("Description:", description, "(type:", typeof description, ")");
    console.log("Issue Category ID:", issue_category_id);
    console.log("Priority ID:", priority_id);

    // Find existing issue
    const issue = await Issue.findByPk(issue_id, { transaction: t });
    if (!issue) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    console.log("🔍 CURRENT ISSUE DATA:");
    console.log("Current title:", issue.title);
    console.log("Current description:", issue.description);

    // Build update object
    const updateData = {};

    // Check each field individually
    if (title !== undefined && title !== null && title !== "") {
      updateData.title = title;
      console.log("✅ Will update title to:", title);
    } else {
      console.log("❌ Title not updated - value:", title);
    }

    if (
      description !== undefined &&
      description !== null &&
      description !== ""
    ) {
      updateData.description = description;
      console.log("✅ Will update description to:", description);
    } else {
      console.log("❌ Description not updated - value:", description);
    }

    if (
      issue_category_id !== undefined &&
      issue_category_id !== null &&
      issue_category_id !== ""
    ) {
      updateData.issue_category_id = issue_category_id;
      console.log("✅ Will update issue_category_id to:", issue_category_id);
    }

    if (
      priority_id !== undefined &&
      priority_id !== null &&
      priority_id !== ""
    ) {
      updateData.priority_id = priority_id;
      console.log("✅ Will update priority_id to:", priority_id);
    }

    if (
      action_taken !== undefined &&
      action_taken !== null &&
      action_taken !== ""
    ) {
      updateData.action_taken = action_taken;
    }

    if (url_path !== undefined && url_path !== null && url_path !== "") {
      updateData.url_path = url_path;
    }

    if (
      issue_description !== undefined &&
      issue_description !== null &&
      issue_description !== ""
    ) {
      updateData.issue_description = issue_description;
    }

    if (
      issue_occured_time !== undefined &&
      issue_occured_time !== null &&
      issue_occured_time !== ""
    ) {
      updateData.issue_occured_time = issue_occured_time;
    }

    updateData.updated_at = new Date();

    console.log("🔄 UPDATE DATA OBJECT:", updateData);
    console.log("Number of fields to update:", Object.keys(updateData).length);

    // Update issue
    if (Object.keys(updateData).length > 0) {
      console.log("🚀 Executing database update...");
      const result = await issue.update(updateData, { transaction: t });
      console.log("✅ Update result:", result);
    } else {
      console.log("⚠️ No fields to update");
    }

    // Handle attachments
    const replaceFiles = replace === "true";
    if (req.files && req.files.length > 0) {
      console.log("📎 Handling file attachments...");
      const issueDir = path.join(
        __dirname,
        `../public/uploads/issues/${issue_id}`
      );
      if (!fs.existsSync(issueDir)) fs.mkdirSync(issueDir, { recursive: true });

      if (replaceFiles) {
        const existingFiles = await IssueAttachment.findAll({
          where: { issue_id },
          transaction: t,
        });
        for (const file of existingFiles) {
          if (fs.existsSync(file.file_path)) fs.unlinkSync(file.file_path);
          await file.destroy({ transaction: t });
        }
      }

      for (const file of req.files) {
        const newFilePath = path.join(issueDir, file.filename);
        fs.renameSync(file.path, newFilePath);

        await IssueAttachment.create(
          {
            attachment_id: uuidv4(),
            issue_id,
            file_name: file.originalname,
            file_path: newFilePath,
            uploaded_by: reported_by,
            created_at: new Date(),
            updated_at: new Date(),
          },
          { transaction: t }
        );
      }
    }

    await t.commit();
    console.log("✅ Transaction committed successfully");

    // Return updated issue - force fresh query
    const updatedIssue = await Issue.findOne({
      where: { issue_id },
      include: [
        { model: IssueAttachment, as: "attachments" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
      ],
    });

    console.log("🔄 FRESH QUERY RESULT:");
    console.log("Updated title:", updatedIssue.title);
    console.log("Updated description:", updatedIssue.description);

    return res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ Error updating issue:", error);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Get all issues
const getIssues = async (req, res) => {
  try {
    const {
      institute_project_id,
      status,
      priority_id,
      issue_category_id,
      assigned_to,
      reported_by,
    } = req.query;

    const whereClause = {};

    if (institute_project_id)
      whereClause.institute_project_id = institute_project_id;
    if (status) whereClause.status = status;
    if (priority_id) whereClause.priority_id = priority_id;
    if (issue_category_id) whereClause.issue_category_id = issue_category_id;
    if (assigned_to) whereClause.assigned_to = assigned_to;
    if (reported_by) whereClause.reported_by = reported_by;

    const issues = await Issue.findAll({
      where: whereClause,
      include: [
        { model: InstituteProject, as: "instituteProject" },
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
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(issues);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Get issue by ID
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByPk(id, {
      include: [
        { model: InstituteProject, as: "instituteProject" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: HierarchyNode, as: "hierarchyNode" },
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
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Update issue
const updateIssue = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      title,
      description,
      issue_category_id,
      hierarchy_node_id,
      priority_id,
      status,
      assigned_to,
      action_taken,
      url_path,
      issue_description,
      issue_occured_time,
      status_change_reason,
    } = req.body;

    const issue = await Issue.findByPk(id, { transaction: t });
    if (!issue) {
      await t.rollback();
      return res.status(404).json({ message: "Issue not found" });
    }

    const oldStatus = issue.status;

    Object.assign(issue, {
      title: title || issue.title,
      description: description || issue.description,
      issue_category_id: issue_category_id || issue.issue_category_id,
      hierarchy_node_id: hierarchy_node_id || issue.hierarchy_node_id,
      priority_id: priority_id || issue.priority_id,
      assigned_to: assigned_to || issue.assigned_to,
      action_taken: action_taken || issue.action_taken,
      url_path: url_path || issue.url_path,
      issue_description: issue_description || issue.issue_description,
      issue_occured_time: issue_occured_time || issue.issue_occured_time,
    });

    // Handle status change
    if (status && status !== issue.status) {
      issue.status = status;

      if (status === "resolved") issue.resolved_at = new Date();
      if (status === "closed") issue.closed_at = new Date();

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
    await t.commit();

    const updatedIssue = await Issue.findByPk(id, {
      include: [
        { model: InstituteProject, as: "instituteProject" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: HierarchyNode, as: "hierarchyNode" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
      ],
    });

    res.status(200).json(updatedIssue);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Delete issue
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByPk(id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    await issue.destroy();
    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  createIssueWithAttachments,
  updateIssueWithAttachments,
};
