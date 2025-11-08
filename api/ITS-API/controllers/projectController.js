const {
  Project,
  Institute,
  Hierarchy,
  InstituteProject,
} = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new project
const createProject = async (req, res) => {
  try {
    const { name, description, is_active, institute_id } = req.body;

    // Check if project exists
    const existingProject = await Project.findOne({ where: { name } });
    if (existingProject)
      return res
        .status(400)
        .json({ message: "Project with this name already exists." });

    const project_id = uuidv4();

    // Create project
    const project = await Project.create({
      project_id,
      name,
      description,
      is_active,
    });

    // If institute_id is provided, create the association
    if (institute_id) {
      const institute = await Institute.findByPk(institute_id);
      if (!institute) {
        return res.status(404).json({ message: "Institute not found" });
      }

      // Check if association already exists
      const existingAssociation = await InstituteProject.findOne({
        where: { institute_id, project_id: project_id },
      });
      if (existingAssociation) {
        return res
          .status(400)
          .json({ message: "Project is already assigned to this institute" });
      }

      // Create association
      await InstituteProject.create({
        institute_project_id: uuidv4(),
        institute_id,
        project_id: project_id,
        is_active: true,
      });
    }

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: Institute,
          as: "institutes",
          through: { attributes: ["is_active"] },
        },
      ],
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id, {
      include: [
        {
          model: Institute,
          as: "institutes",
          through: { attributes: ["is_active"] },
        },
      ],
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.name = name || project.name;
    project.description = description || project.description;
    if (is_active !== undefined) project.is_active = is_active;

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await project.destroy();
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
