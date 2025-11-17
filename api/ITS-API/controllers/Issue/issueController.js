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
  Role,
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
      priority_id,
      action_taken,
      url_path,
      issue_description,
      issue_occured_time,
      replace = false,
    } = req.body;

    const reported_by = req.user?.user_id;
    if (!reported_by)
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });

    if (!title || title.trim() === "")
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });

    // 1️⃣ Get InstituteProject
    const instituteProject = await InstituteProject.findByPk(
      institute_project_id,
      { transaction: t }
    );
    if (!instituteProject) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Institute Project not found" });
    }

    const project_id = instituteProject.project_id;

    // 2️⃣ Get user's assignment along with hierarchy node
    const userAssignment = await ProjectUserRole.findOne({
      where: { user_id: reported_by, project_id, is_active: true },
      include: [
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "parent_id", "name", "level"],
        },
      ],
      transaction: t,
    });

    if (!userAssignment) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this project",
      });
    }

    const hierarchy_node_id = userAssignment.hierarchyNode
      ? userAssignment.hierarchyNode.hierarchy_node_id
      : null;

    console.log("Selected hierarchy node:", hierarchy_node_id);

    // 3️⃣ Determine assigned_to (escalate to parent if external, fallback to internal QA leader)
    let assigned_to = null;

    if (
      userAssignment.hierarchyNode &&
      req.user.user_type === "external_user"
    ) {
      const parentNodeId = userAssignment.hierarchyNode.parent_id;
      if (parentNodeId) {
        const parentAssignment = await ProjectUserRole.findOne({
          where: {
            project_id,
            hierarchy_node_id: parentNodeId,
            is_active: true,
          },
          transaction: t,
        });
        if (parentAssignment) assigned_to = parentAssignment.user_id;
      }
    }

    // fallback to internal QA leader if still null
    if (!assigned_to) {
      const qaLeader = await ProjectUserRole.findOne({
        where: { project_id, is_active: true },
        include: [{ model: Role, as: "role", where: { name: "QA leader" } }],
        transaction: t,
      });
      if (qaLeader) assigned_to = qaLeader.user_id;
    }

    // 4️⃣ Create issue
    const issue_id = uuidv4();
    const issue = await Issue.create(
      {
        issue_id,
        institute_project_id,
        title: title.trim(),
        description,
        issue_category_id: issue_category_id || null,
        hierarchy_node_id,
        priority_id: priority_id || null,
        reported_by,
        assigned_to,
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

    // 5️⃣ Status history
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

    // 6️⃣ Attachments handling
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

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: issue,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    if (req.files && req.files.length > 0) {
      for (const file of req.files)
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
    console.error("Error creating issue:", error);
    return res.status(500).json({ success: false, message: error.message });
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

const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByPk(id, {
      include: [
        // Basic associations
        {
          model: InstituteProject,
          as: "instituteProject",
          include: [
            {
              model: Project,
              as: "project",
              attributes: ["project_id", "name", "description"],
            },
            {
              model: Institute,
              as: "institute",
              attributes: ["institute_id", "name"],
            },
          ],
        },
        {
          model: IssueCategory,
          as: "category",
          attributes: ["category_id", "name", "description"],
        },
        {
          model: IssuePriority,
          as: "priority",
          attributes: ["priority_id", "name", "description"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name", "level", "parent_id"],
        },

        // User associations
        {
          model: User,
          as: "reporter",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: User,
          as: "assignee",
          attributes: ["user_id", "full_name", "email"],
        },

        // Assignment history
        {
          model: IssueAssignment,
          as: "assignments",
          include: [
            {
              model: User,
              as: "assignee",
              attributes: ["user_id", "full_name", "email"],
            },
            {
              model: User,
              as: "assigner",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
          order: [["assigned_at", "DESC"]],
        },

        // Tier management
        {
          model: IssueTier,
          as: "tiers",
          include: [
            {
              model: User,
              as: "handler",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
          order: [["tier_level", "ASC"]],
        },

        // Escalation history
        {
          model: IssueEscalation,
          as: "escalations",
          include: [
            {
              model: User,
              as: "escalator",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
          order: [["escalated_at", "DESC"]],
        },

        // Comments with replies
        {
          model: IssueComment,
          as: "comments",
        },

        // Attachments
        {
          model: IssueAttachment,
          as: "attachments",
          include: [
            {
              model: User,
              as: "uploader",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
          order: [["created_at", "DESC"]],
        },

        // Action history (for tracking accept/resolve/escalate actions)
        {
          model: IssueAction,
          as: "actions",
          include: [
            {
              model: User,
              as: "performer",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
          order: [["created_at", "DESC"]],
        },

        // Status change history
        {
          model: IssueStatusHistory,
          as: "statusHistory",
          include: [
            {
              model: User,
              as: "changer",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
          order: [["created_at", "DESC"]],
        },
      ],
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    console.error("Error fetching issue:", error);
    res.status(500).json({
      success: false,
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
const getAllChildNodes = async (nodeId) => {
  const result = [];
  const stack = [nodeId];

  while (stack.length > 0) {
    const current = stack.pop();
    result.push(current);

    const children = await HierarchyNode.findAll({
      where: { parent_id: current },
      attributes: ["hierarchy_node_id"],
    });

    for (const c of children) {
      stack.push(c.hierarchy_node_id);
    }
  }

  return result;
};

const getMyIssues = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    let issues;

    if (user.user_type === "internal_user") {
      // INTERNAL USERS: Get all issues from their projects
      const projectIds = user.project_roles.map((pr) => pr.project_id);

      issues = await Issue.findAll({
        include: [
          {
            model: InstituteProject,
            as: "instituteProject",
            where: { project_id: projectIds },
            include: [{ model: Project, as: "project", attributes: ["name"] }],
          },
          { model: User, as: "reporter", attributes: ["full_name"] },
          { model: IssuePriority, as: "priority" },
        ],
        order: [["created_at", "DESC"]],
      });
    } else if (user.user_type === "external_user") {
      // EXTERNAL USERS: Get issues by accessible hierarchy nodes
      const allowedNodeIds = new Set();
      for (const pr of user.project_roles) {
        if (pr.hierarchy_node_id) {
          const nodes = await getAllChildNodes(pr.hierarchy_node_id);
          nodes.forEach((n) => allowedNodeIds.add(n));
        }
      }

      issues = await Issue.findAll({
        where: { hierarchy_node_id: [...allowedNodeIds] },
        include: [
          {
            model: InstituteProject,
            as: "instituteProject",
            include: [{ model: Project, as: "project", attributes: ["name"] }],
          },
          { model: User, as: "reporter", attributes: ["full_name"] },
          { model: IssuePriority, as: "priority" },
        ],
        order: [["created_at", "DESC"]],
      });
    }

    return res.json({ success: true, data: issues });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
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
  getMyIssues,
};
