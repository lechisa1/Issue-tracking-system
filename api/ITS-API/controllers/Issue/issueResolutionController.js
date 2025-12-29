const {
  IssueResolution,
  ResolutionAttachment,
  Issue,
  User,
  IssueHistory,
  IssueTier,
  Attachment,
  IssueAction,
  sequelize,
} = require("../../models");

const { v4: uuidv4 } = require("uuid");
const {
  createNotification,
  sendEmailForNotification,
  getUsersForHierarchyNode,
  getUsersWithSameParentHierarchy,
} = require("../../services/notificationService");
// ------------------------------------------------------
//  RESOLVE ISSUE
// ------------------------------------------------------
const resolveIssue = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { issue_id, reason, attachment_ids } = req.body;
    const resolved_by = req.user.user_id;
    const resolver_id = req.user.user_id;
    // 1️⃣ Validate Issue
    const issue = await Issue.findByPk(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    // 2️⃣ Validate User
    const resolver = await User.findByPk(resolved_by);
    if (!resolver)
      return res.status(404).json({ message: "User (resolved_by) not found." });
    if (issue.status === "reopened") {
      const lastResolution = await IssueResolution.findOne({
        where: { issue_id },
      });

      if (!lastResolution) {
        return res.status(400).json({
          success: false,
          error: "No previous resolution found for this issue",
        });
      }

      if (lastResolution.resolved_by !== resolver_id) {
        return res.status(403).json({
          success: false,
          error:
            "Only the user who resolved this issue last can resolve it after reopening",
        });
      }
    }
    const resolution_id = uuidv4();

    // 3️⃣ Create resolution
    await IssueResolution.create(
      {
        resolution_id,
        issue_id,
        reason,
        resolved_by: resolver_id,
        resolved_at: new Date(),
      },
      { transaction: t }
    );

    // 4️⃣ Attach files
    if (attachment_ids?.length > 0) {
      const links = attachment_ids.map((attachment_id) => ({
        resolution_id,
        attachment_id,
        created_at: new Date(),
      }));
      await ResolutionAttachment.bulkCreate(links, { transaction: t });
    }

    // 5️⃣ Update issue status to resolved
    await Issue.update(
      { status: "resolved", updated_at: new Date(), resolved_at: new Date() },
      { where: { issue_id }, transaction: t }
    );

    // 6️⃣ Update current tier status
    const currentTier = await IssueTier.findOne({
      where: { issue_id },
      order: [["assigned_at", "DESC"]],
      transaction: t,
    });

    if (currentTier) {
      await IssueTier.update(
        { status: "resolved", updated_at: new Date() },
        { where: { issue_tier_id: currentTier.issue_tier_id }, transaction: t }
      );
    }

    // 7️⃣ Log Action
    await IssueAction.create(
      {
        action_id: uuidv4(),
        issue_id,
        action_name: "Issue Resolved",
        action_description: `Issue marked as resolved by user`,
        performed_by: resolved_by,
        related_tier: currentTier?.tier_level || null,
      },
      { transaction: t }
    );

    // 8️⃣ Issue History
    await IssueHistory.create(
      {
        history_id: uuidv4(),
        issue_id,
        user_id: resolved_by,
        action: "resolved",
        status_at_time: "resolved",
        escalation_id: null,
        resolution_id,
        notes: `Issue resolved. Reason: ${reason}`,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 9️⃣ Notify requester (database + email)
    const requester = await User.findByPk(issue.reported_by);

    if (requester && requester.user_id !== resolved_by) {
      await createNotification({
        recipient_id: requester.user_id,
        user_id: resolved_by,
        reference_type: "issue",
        reference_id: issue_id,
        type: "issue_resolved",
        title: `Issue Resolved: ${issue.ticket_number}  ,${` by ${reason}`}`,
        body: `${resolver.full_name} resolved your issue. ${
          issue.ticket_number
        }  ,${` by ${reason}`}`,
        payload: { issue_id, project_id: issue.project_id, reason },
        transaction: t,
      });

      // Send email asynchronously
      setTimeout(async () => {
        try {
          const notif = await sequelize.models.Notification.findOne({
            where: { reference_id: issue_id, type: "issue_resolved" },
          });
          if (notif) await sendEmailForNotification(notif);
        } catch (err) {
          console.error("Email send error:", err);
        }
      }, 10);
    }

    // COMMIT ALL
    await t.commit();

    // Return resolution with details
    const fullResolution = await IssueResolution.findOne({
      where: { resolution_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "resolver" },
        {
          model: ResolutionAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
    });

    return res.status(201).json(fullResolution);
  } catch (error) {
    console.error("RESOLUTION ERROR:", error);
    await t.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  GET RESOLUTIONS BY ISSUE ID
// ------------------------------------------------------
const getResolutionsByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const data = await IssueResolution.findAll({
      where: { issue_id },
      include: [
        { model: User, as: "resolver" },
        {
          model: ResolutionAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
      order: [["resolved_at", "DESC"]],
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("RESOLUTION FETCH ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  GET RESOLUTION BY ID
// ------------------------------------------------------
const getResolutionById = async (req, res) => {
  try {
    const { resolution_id } = req.params;

    const resolution = await IssueResolution.findOne({
      where: { resolution_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "resolver" },
        {
          model: ResolutionAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
    });

    if (!resolution)
      return res.status(404).json({ message: "Resolution not found" });

    return res.status(200).json(resolution);
  } catch (error) {
    console.error("GET RESOLUTION ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  DELETE RESOLUTION
// ------------------------------------------------------
const deleteResolution = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { resolution_id } = req.params;

    const resolution = await IssueResolution.findByPk(resolution_id);
    if (!resolution)
      return res.status(404).json({ message: "Resolution not found" });

    // Get the issue_id before deletion to update status
    const issue_id = resolution.issue_id;

    // Delete resolution
    await IssueResolution.destroy({
      where: { resolution_id },
      transaction: t,
    });

    // Update issue status back to in progress or previous status
    const hasOtherResolutions = await IssueResolution.findOne({
      where: { issue_id },
      transaction: t,
    });

    if (!hasOtherResolutions) {
      await Issue.update(
        {
          status: "in_progress",
          updated_at: new Date(),
        },
        {
          where: { issue_id },
          transaction: t,
        }
      );

      // Update tier status back to assigned
      await IssueTier.update(
        {
          status: "assigned",
          updated_at: new Date(),
        },
        {
          where: {
            issue_id,
            status: "resolved",
          },
          transaction: t,
        }
      );
    }

    await t.commit();

    return res.status(204).send();
  } catch (error) {
    console.error("DELETE RESOLUTION ERROR:", error);
    await t.rollback();
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
//  GET LATEST RESOLUTION BY ISSUE ID
// ------------------------------------------------------
const getLatestResolutionByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const resolution = await IssueResolution.findOne({
      where: { issue_id },
      include: [
        { model: User, as: "resolver" },
        {
          model: ResolutionAttachment,
          as: "attachments",
          include: [{ model: Attachment, as: "attachment" }],
        },
      ],
      order: [["resolved_at", "DESC"]],
    });

    if (!resolution)
      return res
        .status(404)
        .json({ message: "No resolution found for this issue" });

    return res.status(200).json(resolution);
  } catch (error) {
    console.error("GET LATEST RESOLUTION ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------
module.exports = {
  resolveIssue,
  getResolutionsByIssueId,
  getResolutionById,
  deleteResolution,
  getLatestResolutionByIssueId,
};
