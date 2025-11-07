const {
  IssueEscalation,
  Issue,
  User,
  IssueTier,
  IssueEscalationHistory,
  IssueAction,
} = require("../../models");
const { v4: uuidv4 } = require("uuid");

// Escalate issue
const escalateIssue = async (req, res) => {
  try {
    const { issue_id, from_tier, to_tier, reason, escalated_by } = req.body;

    // Verify issue exists
    const issue = await Issue.findByPk(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // Verify escalator exists
    const escalator = await User.findByPk(escalated_by);
    if (!escalator) {
      return res.status(404).json({ message: "Escalator user not found." });
    }

    const escalation_id = uuidv4();

    // Create escalation record
    const escalation = await IssueEscalation.create({
      escalation_id,
      issue_id,
      from_tier,
      to_tier,
      reason,
      escalated_by,
      escalated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create escalation history record
    await IssueEscalationHistory.create({
      issue_escalation_history_id: uuidv4(),
      issue_id,
      from_tier,
      to_tier,
      escalated_by,
      created_at: new Date(),
    });

    // Update issue's current tier
    await Issue.update(
      { current_tier: to_tier, updated_at: new Date() },
      { where: { issue_id } }
    );

    // Create tier handling record
    await IssueTier.create({
      issue_tier_id: uuidv4(),
      issue_id,
      tier_level: to_tier,
      handler_id: null, // Can be assigned later
      assigned_at: new Date(),
      status: "pending",
      remarks: `Escalated from ${from_tier}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create action record
    await IssueAction.create({
      action_id: uuidv4(),
      issue_id,
      action_name: "Issue Escalated",
      action_description: `Escalated from ${from_tier} to ${to_tier}`,
      performed_by: escalated_by,
      related_tier: from_tier,
      created_at: new Date(),
    });

    // Return escalation with relations
    const escalationWithDetails = await IssueEscalation.findOne({
      where: { escalation_id: escalation.escalation_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "escalator" },
      ],
    });

    res.status(201).json(escalationWithDetails);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get escalations by issue ID
const getEscalationsByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const escalations = await IssueEscalation.findAll({
      where: { issue_id },
      include: [{ model: User, as: "escalator" }],
      order: [["escalated_at", "DESC"]],
    });

    res.status(200).json(escalations);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get escalation history by issue ID
const getEscalationHistoryByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const escalationHistory = await IssueEscalationHistory.findAll({
      where: { issue_id },
      include: [
        { model: User, as: "escalator" },
        { model: Issue, as: "issue" },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(escalationHistory);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get escalation by ID
const getEscalationById = async (req, res) => {
  try {
    const { escalation_id } = req.params;

    const escalation = await IssueEscalation.findOne({
      where: { escalation_id },
      include: [
        { model: Issue, as: "issue" },
        { model: User, as: "escalator" },
      ],
    });

    if (!escalation) {
      return res.status(404).json({ message: "Escalation not found." });
    }

    res.status(200).json(escalation);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete escalation
const deleteEscalation = async (req, res) => {
  try {
    const { escalation_id } = req.params;

    const escalation = await IssueEscalation.findByPk(escalation_id);
    if (!escalation) {
      return res.status(404).json({ message: "Escalation not found." });
    }

    await IssueEscalation.destroy({
      where: { escalation_id },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update module exports
module.exports = {
  escalateIssue,
  getEscalationsByIssueId,
  getEscalationHistoryByIssueId,
  getEscalationById,
  deleteEscalation,
};
