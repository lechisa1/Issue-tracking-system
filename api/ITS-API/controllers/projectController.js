const {
  Project,
  Institute,
  HierarchyNode,
  ProjectUserRole,
  Role,
  SubRole,
  User,
  UserRoles,
  InstituteProject,
  ProjectMaintenance,
  InternalProjectUserRole,
  UserType,
  sequelize,
  InternalNode,
} = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new project
const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      is_active,
      institute_id,
      maintenance_start,
      maintenance_end,
    } = req.body;

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

    // Create maintenance record if dates are provided
    if (maintenance_start || maintenance_end) {
      await ProjectMaintenance.create({
        maintenance_id: uuidv4(),
        project_id,
        start_date: maintenance_start || null,
        end_date: maintenance_end || null,
      });
    }

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
        // HierarchyNode
        {
          model: ProjectUserRole,
          as: "projectUserRoles", // make sure your Project model has `hasMany(ProjectUserRole, { as: "projectUserRoles" })`
          include: [
            {
              model: User,
              as: "user",
              attributes: ["user_id", "full_name", "email"],
            },
            { model: Role, as: "role", attributes: ["role_id", "name"] },
            {
              model: SubRole,
              as: "subRole",
              attributes: ["sub_role_id", "name"],
            }, // MUST match the alias
            {
              model: HierarchyNode,
              as: "hierarchyNode",
              attributes: ["hierarchy_node_id", "name"],
            },
          ],
        },
        // Maintenance
        {
          model: ProjectMaintenance,
          as: "maintenances", // Make sure your Project model has hasMany(ProjectMaintenance, { as: "maintenances" })
          attributes: [
            "maintenance_id",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
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
// Get all projects by institute ID
const getProjectByInstituteId = async (req, res) => {
  try {
    const { institute_id } = req.params;

    if (!institute_id) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const projects = await Project.findAll({
      include: [
        {
          model: Institute,
          as: "institutes",
          where: { institute_id },
          required: true, // Only return projects linked to this institute
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
              model: HierarchyNode,
              as: "hierarchyNode",
              attributes: ["hierarchy_node_id", "name"],
            },
          ],
        },
        // Maintenance
        {
          model: ProjectMaintenance,
          as: "maintenances", // Make sure your Project model has hasMany(ProjectMaintenance, { as: "maintenances" })
          attributes: [
            "maintenance_id",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
          ],
        },
      ],
    });

    if (!projects || projects.length === 0) {
      return res.status(404).json({
        message: "No projects found for this institute",
      });
    }

    return res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// const assignUserToProject = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const { project_id, user_id, role_id, sub_role_id, hierarchy_node_id } =
//       req.body;

//     // ====== Validate project ======
//     const project = await Project.findByPk(project_id, { transaction: t });
//     if (!project) {
//       await t.rollback();
//       return res
//         .status(404)
//         .json({ success: false, message: "Project not found." });
//     }

//     // ====== Validate user ======
//     const user = await User.findByPk(user_id, { transaction: t });
//     if (!user) {
//       await t.rollback();
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found." });
//     }

//     // ====== Validate role ======
//     const role = await Role.findByPk(role_id, { transaction: t });
//     if (!role) {
//       await t.rollback();
//       return res
//         .status(404)
//         .json({ success: false, message: "Invalid role ID." });
//     }

//     // ====== Optional sub-role ======
//     if (sub_role_id) {
//       const subRole = await SubRole.findByPk(sub_role_id, { transaction: t });
//       if (!subRole) {
//         await t.rollback();
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid sub-role ID." });
//       }
//     }

//     // ====== Prevent duplicate assignment ======
//     const existing = await ProjectUserRole.findOne({
//       where: { project_id, user_id },
//       transaction: t,
//     });
//     if (existing) {
//       await t.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "User already assigned to this project.",
//       });
//     }

//     // ====== External user logic ======
//     if (user.user_type === "external_user") {
//       if (!hierarchy_node_id) {
//         await t.rollback();
//         return res.status(400).json({
//           success: false,
//           message: "External users must be assigned a hierarchy node.",
//         });
//       }

//       // Validate hierarchy node
//       const node = await HierarchyNode.findByPk(hierarchy_node_id, {
//         transaction: t,
//       });
//       if (!node || node.project_id !== project_id) {
//         await t.rollback();
//         return res.status(400).json({
//           success: false,
//           message:
//             "Hierarchy node not found or does not belong to this project.",
//         });
//       }
//     }
//     const finalHierarchyId =
//       user.user_type === "external_user" ? hierarchy_node_id : null;
//     // ====== Create project-user-role ======
//     const assignment = await ProjectUserRole.create(
//       {
//         project_user_role_id: uuidv4(),
//         project_id,
//         user_id,
//         role_id,
//         sub_role_id: sub_role_id ?? null,
//         hierarchy_node_id: hierarchy_node_id,
//         is_active: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       },
//       { transaction: t }
//     );

//     await t.commit();

//     return res.status(201).json({
//       success: true,
//       message: "User assigned to project successfully.",
//       data: assignment,
//     });
//   } catch (error) {
//     if (!t.finished) await t.rollback();
//     console.error("Error assigning user to project:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

const assignUserToProject = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { project_id, user_id, role_id, sub_role_id, hierarchy_node_id } =
      req.body;

    console.log("📥 Received assignment request:", {
      project_id,
      user_id,
      role_id,
      sub_role_id,
      hierarchy_node_id,
    });

    // ====== Validate project ======
    const project = await Project.findByPk(project_id, { transaction: t });
    if (!project) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    // ====== Validate user ======
    const user = await User.findByPk(user_id, {
      include: [
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },
        {
          model: UserRoles,
          as: "userRoles",
          include: [{ model: Role, as: "role" }],
        },
      ],
      transaction: t,
    });

    if (!user) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    console.log("👤 Found user:", {
      user_id: user.user_id,
      full_name: user.full_name,
      user_type: user.userType?.name,
      institute_id: user.institute_id,
    });

    // ====== Validate that user has this role ======
    const userRoleIds = user.userRoles?.map((ur) => ur.role_id) || [];
    if (!userRoleIds.includes(role_id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "User does not have this role assigned.",
      });
    }

    // ====== Optional sub-role ======
    if (sub_role_id) {
      const subRole = await SubRole.findByPk(sub_role_id, { transaction: t });
      if (!subRole) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Invalid sub-role ID." });
      }
    }

    // ====== Prevent duplicate assignment ======
    const existing = await ProjectUserRole.findOne({
      where: { project_id, user_id, role_id },
      transaction: t,
    });
    if (existing) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "User already assigned to this project with this role.",
      });
    }

    // ====== External user logic ======
    let finalHierarchyId = null;
    const userTypeName = user.userType?.name;

    if (userTypeName === "external_user") {
      console.log("🔍 Processing external user - checking hierarchy node");

      if (!hierarchy_node_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "External users must be assigned a hierarchy node.",
        });
      }

      // Validate hierarchy node
      const node = await HierarchyNode.findByPk(hierarchy_node_id, {
        transaction: t,
      });

      console.log("🏢 Hierarchy node validation:", {
        node_found: !!node,
        node_project_id: node?.project_id,
        requested_project_id: project_id,
      });

      if (!node || node.project_id !== project_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message:
            "Hierarchy node not found or does not belong to this project.",
        });
      }

      finalHierarchyId = hierarchy_node_id;
    } else if (userTypeName === "internal_user") {
      console.log("🔍 Processing internal user - hierarchy node optional");
      // Internal users can have hierarchy_node_id but it's not required
      finalHierarchyId = hierarchy_node_id || null;
    }

    console.log("🎯 Final hierarchy_node_id:", finalHierarchyId);

    // ====== Create project-user-role ======
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

    console.log("✅ User assigned successfully:", {
      assignment_id: assignment.project_user_role_id,
      user_id: assignment.user_id,
      role_id: assignment.role_id,
      hierarchy_node_id: assignment.hierarchy_node_id,
    });

    return res.status(201).json({
      success: true,
      message: "User assigned to project successfully.",
      data: assignment,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("❌ Error assigning user to project:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const assignInternalUsersToProject = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { project_id, user_id, role_id, internal_node_id } = req.body;

    // ====== Validate project ======
    const project = await Project.findByPk(project_id, { transaction: t });
    if (!project) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // ====== Validate user ======
    const user = await User.findByPk(user_id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ====== Validate role ======
    const role = await Role.findByPk(role_id, { transaction: t });
    if (!role) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Invalid role ID.",
      });
    }

    // ====== Validate Internal Node (if provided) ======
    let finalInternalNodeId = null;

    if (internal_node_id) {
      const internalNode = await InternalNode.findByPk(internal_node_id, {
        transaction: t,
      });
      if (!internalNode) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Internal node not found.",
        });
      }
      finalInternalNodeId = internal_node_id;
    }

    // ====== Prevent duplicate assignment ======
    const existing = await InternalProjectUserRole.findOne({
      where: { project_id, user_id },
      transaction: t,
    });

    if (existing) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "User is already assigned to this project.",
      });
    }

    // ====== Create internal project-user-role ======
    const assignment = await InternalProjectUserRole.create(
      {
        internal_project_user_role_id: uuidv4(),
        project_id,
        user_id,
        role_id,
        internal_node_id: finalInternalNodeId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Internal user assigned to project successfully.",
      data: assignment,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error assigning internal user to project:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
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

const updateProjectMaintenance = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { maintenance_start, maintenance_end } = req.body;

    // Check if project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Find existing maintenance record for the project
    const maintenance = await ProjectMaintenance.findOne({
      where: { project_id },
    });

    if (!maintenance) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    // Validate dates if provided
    if (
      maintenance_start &&
      maintenance_end &&
      new Date(maintenance_start) > new Date(maintenance_end)
    ) {
      return res
        .status(400)
        .json({ message: "Maintenance start cannot be after end date" });
    }

    // Update fields
    if (maintenance_start) maintenance.start_date = maintenance_start;
    if (maintenance_end) maintenance.end_date = maintenance_end;

    await maintenance.save();

    res.status(200).json({
      message: "Project maintenance updated successfully",
      maintenance,
    });
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

// Get list of projects assigned to a user
const getProjectsAssignedToUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const assignments = await ProjectUserRole.findAll({
      where: { user_id, is_active: true },
      include: [
        {
          model: Project,
          as: "project",
          include: [
            {
              model: InstituteProject,
              as: "instituteProjects",
            },
          ],
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
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name"],
        },
        // Maintenance
        // {
        //   model: ProjectMaintenance,
        //   as: "maintenances", // Make sure your Project model has hasMany(ProjectMaintenance, { as: "maintenances" })
        //   attributes: [
        //     "maintenance_id",
        //     "start_date",
        //     "end_date",
        //     "created_at",
        //     "updated_at",
        //   ],
        // },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Error fetching assigned projects:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  getProjectByInstituteId,
  updateProject,
  updateProjectMaintenance,
  deleteProject,
  assignUserToProject,
  assignInternalUsersToProject,
  removeUserFromProject,
  getProjectsAssignedToUser,
};
