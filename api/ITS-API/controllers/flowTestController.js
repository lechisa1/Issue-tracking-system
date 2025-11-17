const {
  Issue,

  HierarchyNode,

  IssueEscalation,
  Role,
  IssueCategory,
  IssuePriority,
  User,
  InstituteProject,
  ProjectUserRole,
  IssueEscalationHistory,
  IssueStatusHistory,
  sequelize,
  IssueAction,
} = require("../models");

const { Op } = require("sequelize");

const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
// Helper function to get all children nodes of a hierarchy node
const getChildrenNodes = async (hierarchy_node_id, project_id) => {
  try {
    const children = await HierarchyNode.findAll({
      where: {
        parent_id: hierarchy_node_id,
        project_id: project_id,
      },
      attributes: ["hierarchy_node_id", "name", "level"],
    });

    return children;
  } catch (error) {
    console.error("Error getting children nodes:", error);
    return [];
  }
};

// Helper function to get all descendants (children, grandchildren, etc.)
const getAllDescendants = async (hierarchy_node_id, project_id) => {
  try {
    const descendants = [];

    const getDescendantsRecursive = async (node_id) => {
      const children = await getChildrenNodes(node_id, project_id);

      for (const child of children) {
        descendants.push(child.hierarchy_node_id);
        await getDescendantsRecursive(child.hierarchy_node_id);
      }
    };

    await getDescendantsRecursive(hierarchy_node_id);
    return descendants;
  } catch (error) {
    console.error("Error getting all descendants:", error);
    return [];
  }
};

// Helper function to get user's hierarchy position in project
const getUserHierarchyPosition = async (user_id, institute_project_id) => {
  try {
    // First, get the project_id from institute_project
    const instituteProject = await InstituteProject.findByPk(
      institute_project_id
    );
    if (!instituteProject) {
      return null;
    }

    const project_id = instituteProject.project_id;

    // Find user's assignment in this project
    const userAssignment = await ProjectUserRole.findOne({
      where: {
        user_id: user_id,
        project_id: project_id,
        is_active: true,
      },
      include: [
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name", "parent_id", "level"],
        },
      ],
    });

    if (!userAssignment || !userAssignment.hierarchyNode) {
      return null;
    }

    return userAssignment.hierarchyNode;
  } catch (error) {
    console.error("Error in getUserHierarchyPosition:", error);
    return null;
  }
};
const createIssueWithParentAssignment = async (req, res) => {
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
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // ✅ Get reporter's hierarchy position
    const reporterPosition = await getUserHierarchyPosition(
      reported_by,
      institute_project_id
    );

    if (!reporterPosition) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not assigned to a hierarchy node in this project",
      });
    }

    // ✅ Find the immediate parent in hierarchy
    let assigned_to = null;
    if (reporterPosition.parent_id) {
      // Find users assigned to the parent node
      const parentAssignment = await ProjectUserRole.findOne({
        where: {
          hierarchy_node_id: reporterPosition.parent_id,
          project_id: institute_project_id,
          is_active: true,
        },
        transaction: t,
      });

      if (parentAssignment) {
        assigned_to = parentAssignment.user_id;
      }
    }

    // If no parent found, assign to Quality Assurance Leader
    if (!assigned_to) {
      const qaLeader = await ProjectUserRole.findOne({
        where: {
          project_id: institute_project_id,
          is_active: true,
        },
        include: [
          {
            model: Role,
            as: "role",
            where: { name: "Quality Assurance Leader" },
          },
        ],
        transaction: t,
      });

      if (qaLeader) {
        assigned_to = qaLeader.user_id;
      }
    }

    // 1️⃣ Create the issue with automatic parent assignment
    const issue_id = uuidv4();
    const issue = await Issue.create(
      {
        issue_id,
        institute_project_id,
        title: title.trim(),
        description,
        issue_category_id: issue_category_id || null,
        hierarchy_node_id: hierarchy_node_id || reporterPosition.node_id,
        priority_id: priority_id || null,
        reported_by,
        assigned_to, // Automatically assigned to parent or QA Leader
        action_taken: action_taken || null,
        url_path: url_path || null,
        issue_description: issue_description || null,
        issue_occured_time: issue_occured_time || null,
        status: "pending",
        escalation_level: 1, // Start at level 1
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
        reason: "Issue created and automatically assigned to parent",
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 3️⃣ Create escalation history entry
    await IssueEscalationHistory.create(
      {
        escalation_id: uuidv4(),
        issue_id: issue.issue_id,
        from_user_id: reported_by,
        to_user_id: assigned_to,
        escalation_level: 1,
        reason: "Initial assignment to immediate parent",
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 4️⃣ Handle attachments (your existing code)
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

    // Fetch complete issue details
    const issueWithDetails = await Issue.findOne({
      where: { issue_id },
      include: [
        {
          model: IssueAttachment,
          as: "attachments",
          attributes: ["file_name", "file_path"],
        },
        {
          model: User,
          as: "reporter",
          attributes: ["user_id", "full_name"],
        },
        {
          model: User,
          as: "assignee",
          attributes: ["user_id", "full_name"],
        },
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
      message: assigned_to
        ? "Issue created and assigned to your parent"
        : "Issue created and awaiting assignment",
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
// Get issues assigned to current user (from their children)
// Update getMyAssignedIssues to support internal calls
const getMyAssignedIssues = async (req, res, internalCall = false) => {
  try {
    const user_id = internalCall ? req.user_id : req.user?.user_id;
    const { project_id, status } = internalCall ? req.query : req.query;

    if (!user_id) {
      if (internalCall) throw new Error("User not authenticated");
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get user's hierarchy position
    const userPosition = await getUserHierarchyPosition(user_id, project_id);

    if (!userPosition) {
      if (internalCall)
        throw new Error(
          "You are not assigned to a hierarchy node in this project"
        );
      return res.status(403).json({
        success: false,
        message: "You are not assigned to a hierarchy node in this project",
      });
    }

    // Build where clause
    const whereClause = {
      assigned_to: user_id,
    };

    if (project_id) {
      whereClause.institute_project_id = project_id;
    }

    if (status) {
      whereClause.status = status;
    }

    // Get issues assigned to this user
    const assignedIssues = await Issue.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "reporter",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name", "level"],
        },
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
          ],
        },
        {
          model: IssueAttachment,
          as: "attachments",
          attributes: ["file_name", "file_path"],
        },
        {
          model: IssuePriority,
          as: "priority",
          attributes: ["name", "level"],
        },
        {
          model: IssueCategory,
          as: "category",
          attributes: ["name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (internalCall) {
      return {
        success: true,
        data: assignedIssues,
        count: assignedIssues.length,
      };
    }

    return res.status(200).json({
      success: true,
      message: "Issues assigned to you retrieved successfully",
      data: assignedIssues,
      count: assignedIssues.length,
    });
  } catch (error) {
    console.error("Error fetching assigned issues:", error);

    if (internalCall) throw error;

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Similarly update getIssuesFromMyChildren for internal calls
const getIssuesFromMyChildren = async (req, res, internalCall = false) => {
  try {
    const user_id = internalCall ? req.user_id : req.user?.user_id;
    const { project_id } = internalCall ? req.query : req.query;

    if (!user_id) {
      if (internalCall) throw new Error("User not authenticated");
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get user's hierarchy position
    const userPosition = await getUserHierarchyPosition(user_id, project_id);

    if (!userPosition) {
      if (internalCall)
        throw new Error(
          "You are not assigned to a hierarchy node in this project"
        );
      return res.status(403).json({
        success: false,
        message: "You are not assigned to a hierarchy node in this project",
      });
    }

    // Get all descendants (children nodes)
    const descendantNodes = await getAllDescendants(
      userPosition.node_id,
      project_id
    );

    if (descendantNodes.length === 0) {
      const result = {
        success: true,
        message: "No children nodes found",
        data: [],
        count: 0,
      };
      return internalCall ? result : res.status(200).json(result);
    }

    // Get users assigned to descendant nodes
    const childUsers = await ProjectUserRole.findAll({
      where: {
        hierarchy_node_id: descendantNodes,
        project_id: project_id,
        is_active: true,
      },
      attributes: ["user_id"],
    });

    const childUserIds = childUsers.map((user) => user.user_id);

    if (childUserIds.length === 0) {
      const result = {
        success: true,
        message: "No users found in your descendant nodes",
        data: [],
        count: 0,
      };
      return internalCall ? result : res.status(200).json(result);
    }

    // Get issues reported by children users
    const whereClause = {
      reported_by: childUserIds,
    };

    if (project_id) {
      whereClause.institute_project_id = project_id;
    }

    const childIssues = await Issue.findAll({
      where: whereClause,
      include: [
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
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name", "level"],
        },
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
          ],
        },
        {
          model: IssueAttachment,
          as: "attachments",
          attributes: ["file_name", "file_path"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const result = {
      success: true,
      message: "Issues from your children retrieved successfully",
      data: childIssues,
      count: childIssues.length,
    };

    return internalCall ? result : res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching issues from children:", error);

    if (internalCall) throw error;

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// Parent accepts the issue
const acceptIssue = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id } = req.params;
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const issue = await Issue.findOne({
      where: { issue_id },
      transaction: t,
    });

    if (!issue) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    if (issue.assigned_to !== user_id) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this issue",
      });
    }

    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "accepted",
        action_description: "Issue accepted by parent handler",
        performed_by: user_id,
        related_tier: issue.hierarchy_node_id,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // Create status history
    await IssueStatusHistory.create(
      {
        status_history_id: uuidv4(),
        issue_id,
        from_status: "pending",
        to_status: "in_progress",
        changed_by: user_id,
        reason: "Issue accepted and in progress",
        created_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Issue accepted successfully",
      data: issue,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error accepting issue:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Parent resolves the issue
const resolveIssue = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id } = req.params;
    const { resolution_notes } = req.body;
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const issue = await Issue.findOne({
      where: { issue_id },
      transaction: t,
    });

    if (!issue) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    if (issue.assigned_to !== user_id) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this issue",
      });
    }

    // Update issue status
    await issue.update(
      {
        status: "resolved",
        resolution_notes: resolution_notes || null,
        resolved_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );
    // Add action
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "resolved",
        action_description: resolution_notes,
        performed_by: user_id,
        related_tier: issue.hierarchy_node_id,
        created_at: new Date(),
      },
      { transaction: t }
    );
    console.log("yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy", issue.hierarchy_node_id);
    // Create status history
    await IssueStatusHistory.create(
      {
        status_history_id: uuidv4(),
        issue_id,
        from_status: issue.status,
        to_status: "resolved",
        changed_by: user_id,
        reason: "Issue resolved",
        created_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Issue resolved successfully",
      data: issue,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error resolving issue:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Parent escalates the issue to their parent
const escalateIssueToParent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id } = req.params;
    const { reason } = req.body;
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // 1️⃣ Get issue
    const issue = await Issue.findOne({ where: { issue_id }, transaction: t });
    if (!issue) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    if (issue.assigned_to !== user_id) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this issue",
      });
    }

    // 2️⃣ Get InstituteProject to retrieve real project_id
    const instituteProject = await InstituteProject.findByPk(
      issue.institute_project_id
    );
    if (!instituteProject) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Institute Project not found" });
    }
    const project_id = instituteProject.project_id;

    // 3️⃣ Get current user's hierarchy position
    const userPosition = await getUserHierarchyPosition(
      user_id,
      issue.institute_project_id
    );
    console.log("User hierarchy node:", userPosition);

    // 4️⃣ Determine next assignee
    let nextAssignee = null;

    // Try parent node first
    if (userPosition && userPosition.parent_id) {
      const parentAssignment = await ProjectUserRole.findOne({
        where: {
          hierarchy_node_id: userPosition.parent_id,
          project_id,
          is_active: true,
        },
        transaction: t,
      });
      if (parentAssignment) nextAssignee = parentAssignment.user_id;
    }

    // Fallback to QA leader
    if (!nextAssignee) {
      const qaMember = await ProjectUserRole.findOne({
        where: { project_id, is_active: true },
        include: [
          { model: Role, as: "role", where: { name: "Quality Assurance" } },
        ],
        transaction: t,
      });
      if (qaMember) nextAssignee = qaMember.user_id;
    }

    // Fallback to Developer
    if (!nextAssignee) {
      const developer = await ProjectUserRole.findOne({
        where: { project_id, is_active: true },
        include: [{ model: Role, as: "role", where: { name: "Developer" } }],
        transaction: t,
      });
      if (developer) nextAssignee = developer.user_id;
    }

    if (!nextAssignee) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No suitable assignee found for escalation",
      });
    }

    // 5️⃣ Update issue
    await issue.update(
      {
        assigned_to: nextAssignee,
        escalation_level: issue.escalation_level + 1,
        updated_at: new Date(),
      },
      { transaction: t }
    );
    console.log("hhhhhhhhhhhhhhhhhhhhhhgggggggggggggggg", nextAssignee);
    // 6️⃣ Create IssueAction
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "escalated",
        action_description: reason,
        performed_by: user_id,
        related_tier: userPosition ? `from ${userPosition.name}` : "escalated",
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 7️⃣ Create IssueStatusHistory
    await IssueStatusHistory.create(
      {
        status_history_id: uuidv4(),
        issue_id,
        from_status: "in_progress",
        to_status: "escalated",
        changed_by: user_id,
        reason: `Issue escalated: ${reason}`,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 8️⃣ Create IssueEscalationHistory
    await IssueEscalationHistory.create(
      {
        escalation_id: uuidv4(),
        issue_id,
        from_user_id: user_id,
        to_user_id: nextAssignee,
        escalation_level: issue.escalation_level + 1,
        reason,
        created_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Issue escalated successfully",
      data: issue,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error escalating issue:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createIssueWithParentAssignment,
  getMyAssignedIssues,
  getIssuesFromMyChildren,
  acceptIssue,
  resolveIssue,
  escalateIssueToParent,
  getUserHierarchyPosition,
  getChildrenNodes,
  getAllDescendants,
};
