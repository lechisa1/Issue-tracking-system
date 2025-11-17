const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const {
  createIssueWithParentAssignment,
  getMyAssignedIssues,
  getIssuesFromMyChildren,
  acceptIssue,
  resolveIssue,
  escalateIssueToParent,
  getUserHierarchyPosition,
  getChildrenNodes,
  getAllDescendants,
} = require("../controllers/flowTestController");

// Issue Creation with Automatic Parent Assignment
router.post(
  "/create-with-parent",
  authenticate,
  upload.array("attachments", 10), // Allow up to 10 files
  createIssueWithParentAssignment
);

// Get Issues Assigned to Current User (from their children)
router.get("/my-assigned-issues", authenticate, getMyAssignedIssues);

// Get Issues Reported by User's Children
router.get("/issues-from-children", authenticate, getIssuesFromMyChildren);

// Issue Actions for Parents
router.patch("/:issue_id/accept", authenticate, acceptIssue);

router.patch("/:issue_id/resolve", authenticate, resolveIssue);

router.patch("/:issue_id/escalate", authenticate, escalateIssueToParent);

// Hierarchy Information Routes
router.get(
  "/my-hierarchy-position/:project_id",
  authenticate,
  async (req, res) => {
    try {
      const user_id = req.user?.user_id;
      const { project_id } = req.params;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const position = await getUserHierarchyPosition(user_id, project_id);

      if (!position) {
        return res.status(404).json({
          success: false,
          message: "No hierarchy position found for this user in the project",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Hierarchy position retrieved successfully",
        data: position,
      });
    } catch (error) {
      console.error("Error getting hierarchy position:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

router.get("/my-children-nodes/:project_id", authenticate, async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const { project_id } = req.params;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get user's hierarchy position first
    const userPosition = await getUserHierarchyPosition(user_id, project_id);

    if (!userPosition) {
      return res.status(404).json({
        success: false,
        message: "No hierarchy position found for this user",
      });
    }

    const childrenNodes = await getChildrenNodes(
      userPosition.node_id,
      project_id
    );

    return res.status(200).json({
      success: true,
      message: "Children nodes retrieved successfully",
      data: {
        current_node: userPosition,
        children: childrenNodes,
      },
    });
  } catch (error) {
    console.error("Error getting children nodes:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.get("/my-descendants/:project_id", authenticate, async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const { project_id } = req.params;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get user's hierarchy position first
    const userPosition = await getUserHierarchyPosition(user_id, project_id);

    if (!userPosition) {
      return res.status(404).json({
        success: false,
        message: "No hierarchy position found for this user",
      });
    }

    const descendants = await getAllDescendants(
      userPosition.node_id,
      project_id
    );

    return res.status(200).json({
      success: true,
      message: "Descendant nodes retrieved successfully",
      data: {
        current_node: userPosition,
        descendants: descendants,
      },
    });
  } catch (error) {
    console.error("Error getting descendants:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Dashboard Route - Get all relevant issues for parent user
router.get("/parent-dashboard", authenticate, async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const { project_id } = req.query;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get all three types of issues in parallel
    const [assignedIssues, childrenIssues, hierarchyPosition] =
      await Promise.all([
        getMyAssignedIssues(req, res, true), // Pass true to indicate internal call
        getIssuesFromMyChildren(req, res, true), // Pass true to indicate internal call
        getUserHierarchyPosition(user_id, project_id),
      ]);

    // Extract data from responses (if internal call returns data directly)
    const assignedData = assignedIssues?.data || [];
    const childrenData = childrenIssues?.data || [];

    return res.status(200).json({
      success: true,
      message: "Parent dashboard data retrieved successfully",
      data: {
        hierarchy_position: hierarchyPosition,
        assigned_issues: assignedData,
        issues_from_children: childrenData,
        summary: {
          total_assigned: assignedData.length,
          total_from_children: childrenData.length,
          pending_issues: assignedData.filter(
            (issue) => issue.status === "pending"
          ).length,
          in_progress_issues: assignedData.filter(
            (issue) => issue.status === "in_progress"
          ).length,
        },
      },
    });
  } catch (error) {
    console.error("Error getting parent dashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
