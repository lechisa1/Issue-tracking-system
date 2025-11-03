const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} = require("./Issue/issueController");

const {
  addComment,
  getCommentsByIssueId,
  updateComment,
  deleteComment,
} = require("./Issue/issueCommentController");

const {
  assignIssue,
  getAssignmentsByIssueId,
  updateAssignmentStatus,
} = require("./Issue/issueAssignmentController");

const {
  escalateIssue,
  getEscalationsByIssueId,
} = require("./Issue/issueEscalationController");

module.exports = {
  // Issue controllers
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  // Issue Assignment controllers
  assignIssue,
  getAssignmentsByIssueId,
  updateAssignmentStatus,
  // Issue Comment controllers
  addComment,
  getCommentsByIssueId,
  updateComment,
  deleteComment,
  // Issue Escalation controllers
  escalateIssue,
  getEscalationsByIssueId,
};
