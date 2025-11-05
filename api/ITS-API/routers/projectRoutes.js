const express = require("express");
const router = express.Router();
const ProjectController = require("../controllers/projectController");
const {
  validateCreateProject,
  validateUpdateProject,
} = require("../validators/projectValidator");

//  endpoints for Projects

router.post("/", validateCreateProject, ProjectController.createProject);
router.get("/", ProjectController.getProjects);
router.get("/:id", ProjectController.getProjectById);
router.put("/:id", validateUpdateProject, ProjectController.updateProject);
router.delete("/:id", ProjectController.deleteProject);

module.exports = router;
