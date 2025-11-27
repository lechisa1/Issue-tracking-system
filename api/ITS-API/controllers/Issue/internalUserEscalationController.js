const {
  InternalIssueEscalation,
  InternalIssueEscalationHistory,
  Issue,
  Project,
  IssueCategory,
  IssuePriority,
  IssueEscalation,
  InternalEscalationAttachment,
  InternalEscalationComment,
  EscalationAttachment,
  HierarchyNode,
  User,
  IssueComment,
  IssueAttachment,
  Attachment,
  InternalHierarchy,
  Notification,
} = require("../../models");

const fs = require('fs');
const path = require('path');
const { Op } = require("sequelize");

const createEscalation = async (req, res) => {
  try {
    let { escalation_id, issue_id, from_tier, to_tier, escalated_by, action_type, action_note, comments, rejection_reason } = req.body;

    escalated_by = escalated_by || from_tier || req.user?.id;

    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
    if (!issue_id) return res.status(400).json({ success: false, message: "Issue ID is required" });

    const userHierarchy = await InternalHierarchy.findOne({ where: { internal_hierarchy_id: req.user.internal_hierarchy_id } });

    let escalation = await InternalIssueEscalation.findOne({ where: { issue_id } });

    if (!escalation) {
      escalation = await InternalIssueEscalation.create({
        issue_id,
        is_active: true,
        escalated_by,
        escalated_to: to_tier || null,
      });
    } else {
      if (to_tier) await escalation.update({ escalated_to: to_tier });
    }

    if (userHierarchy.parent_id === null) {
      if (action_type === 'reject') {
        issue.status = 'rejected';
        await issue.save();
        if (rejection_reason) action_note = `${action_note || ''} - Rejection reason: ${rejection_reason}`;
      }
    } else {
      if (action_type === 'broadcast' || action_type === 'fixed_return') {
        issue.status = 'fixed';
        await issue.save();
      }
    }

    const historyEntry = await InternalIssueEscalationHistory.create({
      internal_issue_escalation_id: escalation.escalation_id,
      from_tier,
      to_tier,
      escalated_by,
      action_type,
      action_note,
      from_action: action_type,
      to_action: action_type,
    });

    if (req.files?.length > 0) {
      const attachments = req.files.map(file => ({
        internal_issue_escalation_id: escalation.escalation_id,
        uploaded_by: escalated_by,
        file_name: file.originalname,
        file_path: "/" + file.path.split("uploads").pop().replace(/\\/g, "/"),
        mime_type: file.mimetype,
        file_size: file.size,
      }));
      await InternalEscalationAttachment.bulkCreate(attachments);
    }

    let commentData = [];
    if (comments) commentData = typeof comments === 'string' ? JSON.parse(comments) : comments;
    if (action_note) commentData.push({ comment_text: action_note, commented_by: escalated_by });
    if (commentData.length > 0) {
      await InternalEscalationComment.bulkCreate(commentData.map(c => ({
        internal_issue_escalation_id: escalation.escalation_id,
        commented_by: c.commented_by,
        comment_text: c.comment_text,
      })));
    }

    const escalationWithDetails = await InternalIssueEscalation.findByPk(escalation.escalation_id, {
      include: [
        { model: InternalEscalationAttachment, as: 'attachments' },
        { model: InternalEscalationComment, as: 'comments' },
        { model: InternalIssueEscalationHistory, as: 'histories' },
      ],
    });

    res.status(201).json({
      success: true,
      data: { escalation: escalationWithDetails, history_entry: historyEntry },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};



const getEscalationHistory = async (req, res) => {
  try {
    const { issueId } = req.params;

    const escalation = await InternalIssueEscalation.findOne({
      where: { issue_id: issueId },
      include: [
        {
          model: InternalIssueEscalationHistory,
          as: 'histories',
          attributes: ['history_id', 'escalation_id', 'from_tier', 'to_tier', 'escalated_by', 'action_type', 'action_note', 'status', 'created_at', 'updated_at'],
          include: [
            { model: User, as: 'fromUser', attributes: ['user_id', 'full_name'] },
            { model: User, as: 'toUser', attributes: ['user_id', 'full_name'] },
            { model: User, as: 'escalatedByUser', attributes: ['user_id', 'full_name'] }
          ],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!escalation) {
      return res.status(404).json({
        success: false,
        message: 'No escalation found for this issue'
      });
    }

    res.status(200).json({
      success: true,
      data: escalation.histories
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllEscalations = async (req, res) => {
  try {
    const escalations = await InternalIssueEscalation.findAll({
      include: [
        { model: InternalIssueEscalationHistory, as: 'histories' },
        { model: InternalEscalationAttachment, as: 'attachments' },
        { model: InternalEscalationComment, as: 'comments' },
        { model: Issue, as: 'issue' },
      ]
    });
    res.status(200).json({ success: true, data: escalations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserTasks = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.user_id;
    const hierarchyId = user.internal_hierarchy_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user ID not found in token",
      });
    }

    // Load hierarchy and children users
    const hierarchy = hierarchyId
      ? await InternalHierarchy.findOne({
          where: { internal_hierarchy_id: hierarchyId },
          include: [
            {
              model: InternalHierarchy,
              as: "children",
              include: [{ model: User, as: "users" }],
            },
          ],
        })
      : null;

    const childrenUsers = hierarchy?.children?.flatMap((child) => child.users) || [];

    // CASE 1: No hierarchy
    if (!hierarchy) {
      const escalations = await IssueEscalation.findAll({
        include: [
          {
            model: Issue,
            as: "issue",
            where: { status: ["inprogress", "resolved"] },
            include: [
              { model: Project, as: "project" },
              { model: IssueCategory, as: "category" },
              { model: IssuePriority, as: "priority" },
              { model: HierarchyNode, as: "hierarchyNode" },
              { model: User, as: "reporter" },
              { model: User, as: "assignee" },
            ],
          },
          { model: User, as: "escalator" },
        ],
      });

      const resultIssues = await Promise.all(
        escalations.map(async (esc) => {
          const internalEscalation = await InternalIssueEscalation.findOne({
            where: { issue_id: esc.issue_id },
            include: [
              { model: InternalEscalationAttachment, as: "attachments" },
              { model: InternalEscalationComment, as: "comments" },
              { 
                model: InternalIssueEscalationHistory, 
                as: "histories",
                include: [
                  { model: User, as: "fromTier", attributes: ["user_id", "full_name", "email"] },
                  { model: User, as: "toTier", attributes: ["user_id", "full_name", "email"] },
                ],
              },
            ],
          });

          return {
            ...esc.issue.dataValues,
            internalEscalation: internalEscalation
              ? {
                  ...internalEscalation.dataValues,
                  attachments: internalEscalation.attachments,
                  comments: internalEscalation.comments,
                  histories: internalEscalation.histories.map((h) => ({
                    ...h.dataValues,
                    fromTier: h.fromTier ? h.fromTier.full_name : null,
                    toTier: h.toTier ? h.toTier.full_name : null,
                  })),
                }
              : null,
            childrenUsers: [],
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: resultIssues.length,
        issues: resultIssues,
      });
    }

    // CASE 2: Top-level hierarchy
    const isTopLevel = hierarchy.parent_id === null;
    if (isTopLevel) {
      const [internalEscalations, issueEscalations] = await Promise.all([
        InternalIssueEscalation.findAll({
          include: [
            { model: InternalEscalationAttachment, as: "attachments" },
            { model: InternalEscalationComment, as: "comments" },
            { 
              model: InternalIssueEscalationHistory, 
              as: "histories",
              include: [
                { model: User, as: "fromTier", attributes: ["user_id", "full_name", "email"] },
                { model: User, as: "toTier", attributes: ["user_id", "full_name", "email"] },
              ]
            },
            {
              model: Issue,
              as: "issue",
              include: [
                { model: Project, as: "project" },
                { model: IssueCategory, as: "category" },
                { model: IssuePriority, as: "priority" },
                { model: HierarchyNode, as: "hierarchyNode" },
                { model: User, as: "reporter" },
                { model: User, as: "assignee" },
              ],
            },
          ],
        }),
        IssueEscalation.findAll({
          include: [
            {
              model: Issue,
              as: "issue",
              where: { status: ["inprogress", "resolved"] },
              include: [
                { model: Project, as: "project" },
                { model: IssueCategory, as: "category" },
                { model: IssuePriority, as: "priority" },
                { model: HierarchyNode, as: "hierarchyNode" },
                { model: User, as: "reporter" },
                { model: User, as: "assignee" },
              ],
            },
            { model: User, as: "escalator" },
          ],
        }),
      ]);

      // Remove duplicates that already exist in internalEscalations
      const internalIssueIds = new Set(internalEscalations.map((esc) => esc.issue_id));
      const filteredIssueEscalations = issueEscalations.filter(
        (esc) => !internalIssueIds.has(esc.issue_id)
      );

      const mappedInternal = internalEscalations.map((esc) => ({
        ...esc.issue.dataValues,
        internalEscalation: {
          ...esc.dataValues,
          attachments: esc.attachments,
          comments: esc.comments,
          histories: esc.histories.map((h) => ({
            ...h.dataValues,
            fromTier: h.fromTier ? h.fromTier.full_name : null,
            toTier: h.toTier ? h.toTier.full_name : null,
          })),
        },
        childrenUsers: childrenUsers.map((child) => ({
          user_id: child.user_id,
          full_name: child.full_name,
          email: child.email,
          issues: [],
        })),
      }));

      const mappedIssues = filteredIssueEscalations.map((esc) => ({
        ...esc.issue.dataValues,
        internalEscalation: null,
        childrenUsers: childrenUsers.map((child) => ({
          user_id: child.user_id,
          full_name: child.full_name,
          email: child.email,
          issues: [],
        })),
      }));

      const mergedIssues = [...mappedInternal, ...mappedIssues];

      return res.status(200).json({
        success: true,
        count: mergedIssues.length,
        issues: mergedIssues,
      });
    }

    // CASE 3: Normal user → fetch from histories where to_tier = userId
    const histories = await InternalIssueEscalationHistory.findAll({
      where: { to_tier: userId },
      include: [
        {
          model: InternalIssueEscalation,
          as: "escalation",
          required: false,
          include: [
            {
              model: Issue,
              as: "issue",
              required: false,
              include: [
                { model: Project, as: "project" },
                { model: IssueCategory, as: "category" },
                { model: IssuePriority, as: "priority" },
                { model: HierarchyNode, as: "hierarchyNode" },
                { model: User, as: "reporter" },
                { model: User, as: "assignee" },
              ],
            },
            { model: InternalEscalationAttachment, as: "attachments" },
            { model: InternalEscalationComment, as: "comments" },
          ],
        },
        { model: User, as: "fromTier", attributes: ["user_id", "full_name"] },
        { model: User, as: "toTier", attributes: ["user_id", "full_name"] },
      ],
    });

    const resultIssues = histories
      .map((h) => {
        const issue = h.escalation?.issue;
        if (!issue) return null;

        return {
          ...issue.dataValues,
          internalEscalation: h.escalation
            ? {
                ...h.escalation.dataValues,
                attachments: h.escalation.attachments,
                comments: h.escalation.comments,
                histories: [
                  {
                    ...h.dataValues,
                    fromTier: h.fromTier ? h.fromTier.full_name : null,
                    toTier: h.toTier ? h.toTier.full_name : null,
                  },
                ],
              }
            : null,
          childrenUsers: childrenUsers.map((child) => ({
            user_id: child.user_id,
            full_name: child.full_name,
            email: child.email,
            issues: [],
          })),
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: resultIssues.length,
      issues: resultIssues,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};






const getEscalationById = async (req, res) => {
  try {
    const { id } = req.params;
    const escalation = await InternalIssueEscalation.findByPk(id, {
      include: [
        { model: InternalIssueEscalationHistory, as: 'histories' },
        { model: InternalEscalationAttachment, as: 'attachments' },
        { model: InternalEscalationComment, as: 'comments' },
        { model: Issue, as: 'issue' },
      ]
    });
    if (!escalation) {
      return res.status(404).json({ success: false, message: 'Escalation not found' });
    }
    res.status(200).json({ success: true, data: escalation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const escalation = await InternalIssueEscalation.findByPk(id);
    if (!escalation) {
      return res.status(404).json({ success: false, message: 'Escalation not found' });
    }
    await escalation.update(updateData);
    res.status(200).json({ success: true, message: 'Escalation updated successfully', data: escalation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    const escalation = await InternalIssueEscalation.findByPk(id);
    if (!escalation) {
      return res.status(404).json({ success: false, message: 'Escalation not found' });
    }
    await escalation.destroy();
    res.status(200).json({ success: true, message: 'Escalation deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkAndProcessEscalationDueDates = async () => {
  try {
    // Find active escalations with due_date_in_days not null and greater than 0
    const activeEscalations = await InternalIssueEscalation.findAll({
      where: {
        is_active: true,
        due_date_in_days: { [Op.gt]: 0 },
      },
      include: [
        {
          model: User,
          as: 'toUser',
          include: [
            {
              model: InternalHierarchy,
              as: 'internalHierarchy',
              include: [{
                model: InternalHierarchy,
                as: 'children'
              }]
            }
          ]
        },
        {
          model: User,
          as: 'escalatedBy'
        },
      ]
    });

    for (const escalation of activeEscalations) {
      const toUser = escalation.toUser;
      if (!toUser || !toUser.internalHierarchy) continue;

      // Check if the escalated user is at the last child hierarchy (children.length === 0)
      if (toUser.internalHierarchy.children && toUser.internalHierarchy.children.length === 0) {
        // Decrement due_date_in_days by 1
        escalation.due_date_in_days -= 1;

        if (escalation.due_date_in_days <= 0) {
          // Mark escalation inactive
          escalation.is_active = false;

          // Create notification for the assigner (escalated_by)
          await Notification.create({
            user_id: escalation.escalated_by,
            message: `The due date for issue escalation with ID ${escalation.escalation_id} has expired.`,
            type: 'escalation_due_date_expired',
            is_read: false,
          });
        }

        // Save the updated escalation
        await escalation.save();
      }
    }
  } catch (error) {
    console.error('Error processing escalation due dates:', error);
  }
};


module.exports = {
  createEscalation,
  getEscalationHistory,
  getAllEscalations,
  getUserTasks,
  getEscalationById,
  updateEscalation,
  deleteEscalation,
  checkAndProcessEscalationDueDates,
};
