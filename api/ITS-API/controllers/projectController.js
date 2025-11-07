const { Project ,Institute,User,Role,SubRole} = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new Project

const createProject = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      name,
      code,
      description,
      institute_id
    } = req.body;

    // Check if project code already exists
    const existingProject = await Project.findOne({
      where: { code },
      transaction: t
    });

    if (existingProject) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Project code already exists"
      });
    }

    // Validate institute if provided
    if (institute_id) {
      const institute = await Institute.findByPk(institute_id, { transaction: t });
      if (!institute) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid institute ID"
        });
      }
    }

    // Create project
    const project = await Project.create({
      project_id: uuidv4(),
      name,
      code,
      description,
      institute_id,
      created_by: req.user.user_id, // From auth middleware
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction: t });

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Error creating project",
      error: error.message
    });
  }
};


const assignUsersToProject = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { projectId } = req.params;
    const { team_members } = req.body;

    // Validate project exists
    const project = await Project.findByPk(projectId, { transaction: t });
    if (!project) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const assignments = [];

    for (const member of team_members) {
      const { user_id, role_id, sub_role_id } = member;

      // Validate user exists
      const user = await User.findByPk(user_id, { transaction: t });
      if (!user) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `User not found: ${user_id}`
        });
      }

      // Validate role exists
      const role = await Role.findByPk(role_id, { transaction: t });
      if (!role) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Role not found: ${role_id}`
        });
      }

      // Validate sub-role if provided
      if (sub_role_id) {
        const subRole = await SubRole.findOne({
          where: {
            sub_role_id,
            role_id
          },
          transaction: t
        });
        if (!subRole) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: `Sub-role not found or doesn't match role: ${sub_role_id}`
          });
        }
      }

      // Check if user already assigned to this project
      const existingAssignment = await ProjectUserRoles.findOne({
        where: {
          project_id: projectId,
          user_id: user_id
        },
        transaction: t
      });

      if (existingAssignment) {
        // Update existing assignment
        await existingAssignment.update({
          role_id,
          sub_role_id,
          updated_at: new Date()
        }, { transaction: t });
        assignments.push(existingAssignment);
      } else {
        // Create new assignment
        const assignment = await ProjectUserRoles.create({
          project_user_role_id: uuidv4(),
          project_id: projectId,
          user_id,
          role_id,
          sub_role_id,
          assigned_by: req.user.user_id,
          assigned_at: new Date(),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }, { transaction: t });
        assignments.push(assignment);
      }
    }

    await t.commit();

    // Get project with updated team
    const projectWithTeam = await Project.findByPk(projectId, {
      include: [{
        model: ProjectUserRoles,
        as: 'teamMembers',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'position']
          },
          {
            model: Role,
            as: 'role',
            attributes: ['role_id', 'name']
          },
          {
            model: SubRole,
            as: 'subRole',
            attributes: ['sub_role_id', 'name']
          }
        ]
      }]
    });

    return res.status(200).json({
      success: true,
      message: "Users assigned to project successfully",
      data: projectWithTeam
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Error assigning users to project",
      error: error.message
    });
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
  assignUsersToProject,
};
