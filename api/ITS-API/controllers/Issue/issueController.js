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

  IssueSolution,
  IssueSolutionAttachment,
  IssueAttachment,
  Attachment,
  IssueAction,
  IssueStatusHistory,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

// ================================
// CREATE ISSUE (with optional attachments)
// ================================
const createIssue = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      project_id,
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
      attachment_ids, // optional array of attachment IDs
    } = req.body;

    const issue_id = uuidv4();

    const issue = await Issue.create(
      {
        issue_id,
        project_id: project_id || null,
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

    // Link attachments if provided
    if (
      attachment_ids &&
      Array.isArray(attachment_ids) &&
      attachment_ids.length > 0
    ) {
      const links = attachment_ids.map((attachment_id) => ({
        issue_id: issue.issue_id,
        attachment_id,
      }));
      await IssueAttachment.bulkCreate(links, { transaction: t });
    }

    await t.commit();

    // Return full issue details including attachments
    const issueWithDetails = await Issue.findOne({
      where: { issue_id: issue.issue_id },
      include: [
        { model: Project, as: "project" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: HierarchyNode, as: "hierarchyNode" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
        {
          model: IssueAttachment,
          as: "attachments",
          include: [
            {
              model: Attachment,
              as: "attachment",
            },
          ],
        },
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

// ================================
// GET ALL ISSUES
// ================================
const getIssues = async (req, res) => {
  try {
    const {
      project_id,
      status,
      priority_id,
      issue_category_id,
      assigned_to,
      reported_by,
    } = req.query;

    const whereClause = {};
    if (project_id) whereClause.project_id = project_id;
    if (status) whereClause.status = status;
    if (priority_id) whereClause.priority_id = priority_id;
    if (issue_category_id) whereClause.issue_category_id = issue_category_id;
    if (assigned_to) whereClause.assigned_to = assigned_to;
    if (reported_by) whereClause.reported_by = reported_by;

    const issues = await Issue.findAll({
      where: whereClause,
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

// ================================
// GET ALL ISSUES BY USER ID
// ================================
const getIssuesByUserId = async (req, res) => {
  try {
    const { id: user_id } = req.params;

    const whereClause = {};
    if (user_id) whereClause.reported_by = user_id;

    const issues = await Issue.findAll({
      where: whereClause,
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

// ================================
// GET ISSUE BY ID
// ================================
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByPk(id, {
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

// ================================
// GET ISSUES BY HIERARCHY NODE ID
// ================================
const getIssuesByHierarchyNodeId = async (req, res) => {
  try {
    const { hierarchy_node_id, project_id } = req.params;

    if (!hierarchy_node_id || !project_id) {
      return res.status(400).json({
        message: "Hierarchy node ID and Project ID are required",
      });
    }

    const issues = await Issue.findAll({
      where: {
        hierarchy_node_id,
        project_id,
      },
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

// ================================
// GET ISSUES BY MULTIPLE HIERARCHY NODE ID
// ================================
// const getIssuesByMultipleHierarchyNodes = async (req, res) => {
//   try {
//     const { pairs, user_id } = req.params; // Change from req.query to req.params

//     if (!pairs) {
//       return res.status(400).json({
//         message: "Pairs parameter is required",
//       });
//     }

//     if (!user_id) {
//       return res.status(400).json({
//         message: "User ID is required",
//       });
//     }

//     let pairsArray;
//     try {
//       pairsArray = JSON.parse(pairs);
//     } catch (parseError) {
//       return res.status(400).json({
//         message: "Invalid pairs format. Expected JSON array",
//       });
//     }

//     if (!Array.isArray(pairsArray)) {
//       return res.status(400).json({
//         message: "Pairs must be an array",
//       });
//     }

//     // Validate each pair
//     const validPairs = pairsArray.filter(
//       (pair) => pair.project_id && pair.hierarchy_node_id
//     );

//     if (validPairs.length === 0) {
//       return res.status(400).json({
//         message:
//           "No valid pairs provided. Each pair must have project_id and hierarchy_node_id",
//       });
//     }

//     // Create where conditions for all pairs
//     const whereConditions = {
//       [Op.or]: validPairs.map((pair) => ({
//         project_id: pair.project_id,
//         hierarchy_node_id: pair.hierarchy_node_id,
//       })),
//       // ❗ EXCLUDE issues reported by this user
//       reported_by: {
//         [Op.ne]: user_id,
//       },
//     };

//     const issues = await Issue.findAll({
//       where: whereConditions,
//       include: [
//         { model: Project, as: "project" },
//         { model: IssueCategory, as: "category" },
//         { model: IssuePriority, as: "priority" },
//         { model: HierarchyNode, as: "hierarchyNode" },
//         { model: User, as: "reporter" },
//         { model: User, as: "assignee" },
//         {
//           model: IssueComment,
//           as: "comments",
//           include: [{ model: User, as: "author" }],
//         },
//         {
//           model: IssueAttachment,
//           as: "attachments",
//           include: [{ model: Attachment, as: "attachment" }],
//         },
//       ],
//       order: [["created_at", "DESC"]],
//     });

//     res.status(200).json(issues);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

const getIssuesByMultipleHierarchyNodes = async (req, res) => {
  try {
    const { pairs, user_id } = req.params;

    if (!pairs || !user_id)
      return res
        .status(400)
        .json({ message: "Pairs and user_id are required" });

    let pairsArray;
    try {
      pairsArray = JSON.parse(pairs);
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid pairs format. Expected JSON array" });
    }

    const validPairs = pairsArray.filter(
      (p) => p.project_id && p.hierarchy_node_id
    );
    if (validPairs.length === 0)
      return res.status(400).json({
        message:
          "No valid pairs provided. Each pair must have project_id and hierarchy_node_id",
      });

    // ------------------------------------------------------------
    // 1️⃣ Get levels of all requested hierarchy nodes
    // ------------------------------------------------------------
    const hierarchyNodes = await HierarchyNode.findAll({
      where: { hierarchy_node_id: validPairs.map((p) => p.hierarchy_node_id) },
    });

    const hierarchyLevels = hierarchyNodes.map((n) => n.level);

    // ------------------------------------------------------------
    // 2️⃣ Find all hierarchy_node_ids at those levels (siblings)
    // ------------------------------------------------------------
    const siblingNodes = await HierarchyNode.findAll({
      where: { level: { [Op.in]: hierarchyLevels } },
    });
    const siblingNodeIds = siblingNodes.map((n) => n.hierarchy_node_id);

    // ------------------------------------------------------------
    // 3️⃣ GET DIRECT ISSUES (all siblings)
    // ------------------------------------------------------------
    const directIssues = await Issue.findAll({
      where: {
        project_id: validPairs.map((p) => p.project_id),
        hierarchy_node_id: { [Op.in]: siblingNodeIds },
        reported_by: { [Op.ne]: user_id },
      },
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
      order: [["created_at", "DESC"]],
    });

    // ------------------------------------------------------------
    // 4️⃣ GET ESCALATED ISSUES (from IssueTier)
    // ------------------------------------------------------------
    const escalatedIssueTiers = await IssueTier.findAll({
      where: {
        tier_level: { [Op.in]: siblingNodeIds },
        status: { [Op.ne]: "closed" },
      },
      include: [
        {
          model: Issue,
          as: "issue",
          required: true,
          where: { reported_by: { [Op.ne]: user_id } }, // <<<< EXCLUDE CREATOR
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
      ],
    });
    // const escalatedIssueTiers = await IssueTier.findAll({
    //   where: {
    //     tier_level: {
    //       [Op.in]: validPairs.map((p) => p.hierarchy_node_id),
    //     },
    //     status: { [Op.ne]: "closed" },
    //   },
    //   include: [
    //     {
    //       model: Issue,
    //       as: "issue",
    //       where: {
    //         reported_by: { [Op.ne]: user_id },
    //       },
    //       include: [
    //         { model: Project, as: "project" },
    //         { model: IssueCategory, as: "category" },
    //         { model: IssuePriority, as: "priority" },
    //         { model: HierarchyNode, as: "hierarchyNode" },
    //         { model: User, as: "reporter" },
    //         { model: User, as: "assignee" },
    //         {
    //           model: IssueComment,
    //           as: "comments",
    //           include: [{ model: User, as: "author" }],
    //         },
    //         {
    //           model: IssueAttachment,
    //           as: "attachments",
    //           include: [{ model: Attachment, as: "attachment" }],
    //         },
    //       ],
    //     },
    //   ],
    // });

    // Extract Issues from IssueTier
    const escalatedIssues = escalatedIssuesEscalation.map((t) => t.issue);
    const escalatedIssues = escalatedIssueTiers.map((t) => t.issue);


    // ------------------------------------------------------------
    // 5️⃣ MERGE BOTH RESULTS WITHOUT DUPLICATES
    // ------------------------------------------------------------
    const issuesMap = new Map();
    directIssues.forEach((issue) => issuesMap.set(issue.issue_id, issue));
    escalatedIssues.forEach((issue) => issuesMap.set(issue.issue_id, issue));

    const finalIssues = Array.from(issuesMap.values());

    res.status(200).json({
      success: true,
      count: finalIssues.length,
      issues: finalIssues,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const getEscalatedIssuesForUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id)
      return res.status(400).json({ message: "User ID is required" });

    // 1️⃣ Get user info and hierarchy node
    const user = await User.findByPk(user_id, {
      include: [
        {
          model: ProjectRole,
          as: "project_roles",
          include: ["hierarchy_node"],
        },
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const hierarchyNodeIds = user.project_roles.map(
      (r) => r.hierarchy_node.hierarchy_node_id
    );

    // 2️⃣ Get escalated issues from IssueTier
    const escalatedIssueTiers = await IssueTier.findAll({
      where: {
        tier_level: { [Op.in]: hierarchyNodeIds },
        status: { [Op.ne]: "closed" },
      },
      include: [
        {
          model: Issue,
          as: "issue",
          where: {
            reported_by: { [Op.ne]: user_id }, // optional
          },
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
      ],
    });

    const escalatedIssues = escalatedIssueTiers.map((t) => t.issue);

    res.status(200).json({
      success: true,
      count: escalatedIssues.length,
      issues: escalatedIssues,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const acceptIssue = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id } = req.body;
    const user_id = req.user?.user_id;

    const issue = await Issue.findByPk(issue_id, { transaction: t });
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Store action
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

    // Update issue status to 'in_progress'
    const oldStatus = issue.status;
    issue.status = "in_progress"; // <--- status update
    await issue.save({ transaction: t });

    // Store status history
    await IssueStatusHistory.create(
      {
        status_history_id: uuidv4(),
        issue_id,
        from_status: oldStatus,
        to_status: issue.status,
        changed_by: user_id,
        reason: "Issue accepted and marked In Progress",
        created_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();
    return res.json({
      success: true,
      message: "Issue status updated to In Progress.",
    });
  } catch (error) {
    await t.rollback();
    console.error("ACCEPT ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ================================
// UPDATE ISSUE (with attachments)
// ================================

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
      attachment_ids, // optional: attach new files or replace
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

    await issue.save({ transaction: t });

    // Link new attachments if provided
    if (
      attachment_ids &&
      Array.isArray(attachment_ids) &&
      attachment_ids.length > 0
    ) {
      const existingLinks = await IssueAttachment.findAll({
        where: { issue_id: issue.issue_id },
        transaction: t,
      });
      const existingIds = existingLinks.map((l) => l.attachment_id);

      const newLinks = attachment_ids
        .filter((aid) => !existingIds.includes(aid))
        .map((aid) => ({ issue_id: issue.issue_id, attachment_id: aid }));

      if (newLinks.length > 0) {
        await IssueAttachment.bulkCreate(newLinks, { transaction: t });
      }
    }

    await t.commit();

    const updatedIssue = await Issue.findByPk(id, {
      include: [
        { model: Project, as: "project" },
        { model: IssueCategory, as: "category" },
        { model: IssuePriority, as: "priority" },
        { model: HierarchyNode, as: "hierarchyNode" },
        { model: User, as: "reporter" },
        { model: User, as: "assignee" },
        {
          model: IssueAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
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

// ================================
// DELETE ISSUE
// ================================
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

const resolveIssue = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { issue_id, resolution_note, solution_description } = req.body;
    const user_id = req.user?.user_id;
    console.log("userrrrrrrrrrrrr", user_id);
    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (issue.status !== "in_progress") {
      return res.status(400).json({
        message: "Only issues with status 'in_progress' can be resolved",
      });
    }
    // 1️⃣ Update issue status
    await issue.update(
      {
        status: "resolved",
        resolved_at: new Date(),
        action_taken: resolution_note,
      },
      { transaction: t }
    );

    // 2️⃣ Add action record
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "resolved",
        action_description: resolution_note,
        performed_by: user_id,
        related_tier: issue.hierarchy_node_id,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 3️⃣ Add history record
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

    // 4️⃣ Add solution record
    const solution = await IssueSolution.create(
      {
        solution_id: uuidv4(),
        issue_id,
        description: solution_description || null,
        created_by: user_id,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 5️⃣ Handle uploaded files
    if (req.files && req.files.length > 0) {
      const solutionAttachments = req.files.map((file) => ({
        issue_solution_attachment_id: uuidv4(),
        solution_id: solution.solution_id,
        file_name: file.filename || file.originalname,
        original_name: file.originalname,
        mime_type: file.mimetype,
        path: file.path.replace(/\\/g, "/"), // normalize for Windows paths
        created_at: new Date(),
      }));

      await IssueSolutionAttachment.bulkCreate(solutionAttachments, {
        transaction: t,
      });
    }

    await t.commit();

    res.json({
      success: true,
      message: "Issue resolved successfully with solution",
      solution_id: solution.solution_id,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  getIssuesByUserId,
  getIssuesByHierarchyNodeId,
  getIssuesByMultipleHierarchyNodes,
  updateIssue,
  deleteIssue,
  resolveIssue,
  acceptIssue,
};
