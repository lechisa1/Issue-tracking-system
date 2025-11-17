const {
  Project,
  Institute,
  HierarchyNode,
  ProjectUserRole,
  Role,
  SubRole,
  User,
  InstituteProject,
  sequelize,
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
      institute_id: institute_id || null,
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
      const institute_project_id = await InstituteProject.create({
        institute_project_id: uuidv4(),
        institute_id,
        project_id: project_id,
        is_active: true,
      });
      console.log(
        "institute_project_id institute_project_id institute_project_id",
        institute_project_id
      );
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
        {
          model: ProjectUserRole,
          as: "projectUserRoles",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["user_id", "full_name", "email"],
            },
            {
              model: Role,
              as: "role",
              attributes: ["role_id", "name"],
            },
            {
              model: SubRole,
              as: "subRole",
              attributes: ["sub_role_id", "name"],
            },
            {
              model: HierarchyNode, // <-- Add this
              as: "hierarchyNode", // must match your alias in model association
              attributes: ["hierarchy_node_id", "name"],
            },
          ],
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

const assignUserToProject = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { project_id, user_id, role_id, sub_role_id, hierarchy_node_id } =
      req.body;

    // ===== Validate project =====
    const project = await Project.findByPk(project_id, { transaction: t });
    if (!project) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    // ===== Validate user =====
    const user = await User.findByPk(user_id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // ===== Validate role =====
    const role = await Role.findByPk(role_id, { transaction: t });
    if (!role) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Invalid role ID." });
    }

    // ===== Optional sub-role =====
    if (sub_role_id) {
      const subRole = await SubRole.findByPk(sub_role_id, { transaction: t });
      if (!subRole) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Invalid sub-role ID." });
      }
    }

    // ===== Prevent duplicate assignment =====
    const existing = await ProjectUserRole.findOne({
      where: { project_id, user_id },
      transaction: t,
    });
    if (existing) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "User already assigned to this project.",
      });
    }

    // ===== Validate hierarchy node if provided =====
    let finalHierarchyId = null;
    if (hierarchy_node_id) {
      const node = await HierarchyNode.findByPk(hierarchy_node_id, {
        transaction: t,
      });
      if (!node) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Hierarchy node not found.",
        });
      }
      // Optionally check if node belongs to project
      if (node.project_id !== project_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Hierarchy node does not belong to this project.",
        });
      }

      finalHierarchyId = hierarchy_node_id;
    }
    console.log("uuuuuuuuuuuuuuuuuuuuuuuuuuuu", finalHierarchyId);
    // ===== Create project-user-role =====
    const assignment = await ProjectUserRole.create(
      {
        project_user_role_id: uuidv4(),
        project_id,
        user_id,
        role_id,
        sub_role_id: sub_role_id ?? null,
        hierarchy_node_id: finalHierarchyId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "User assigned to project successfully.",
      data: assignment,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error assigning user to project:", error);
    return res.status(500).json({ success: false, message: error.message });
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
const removeUserFromProject = async (req, res) => {
  try {
    const { project_id, user_id } = req.body;

    const deleted = await ProjectUserRole.destroy({
      where: { project_id, user_id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User not found in this project.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User removed from project successfully",
    });
  } catch (error) {
    console.error("Error removing user from project:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  assignUserToProject,
  removeUserFromProject,
};
