const { Project } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new Project
const createProject = async (req, res) => {
  try {
    const { name, branch_id, description } = req.body;

    // Check if Project exists
    const existingProject = await Project.findOne({ where: { name } });
    if (existingProject)
      return res.status(400).json({ message: "Project with this name already exists." });

    const project_id = uuidv4();

    // Create Project
    const project = await Project.create({
      project_id,
      name,
      branch_id,
      description,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all Projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: require("../models").Branch,
          as: "branch",
        },
      ],
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get Project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id, {
      include: [
        {
          model: require("../models").Branch,
          as: "branch",
        },
      ],
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update Project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, branch_id, description } = req.body;

    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.name = name || project.name;
    project.branch_id = branch_id || project.branch_id;
    project.description = description !== undefined ? description : project.description;

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete Project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await project.destroy();
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
