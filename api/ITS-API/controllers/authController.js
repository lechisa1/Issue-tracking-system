const {
  User,
  UserType,
  Institute,
  ProjectUserRole,
  Project,
  HierarchyNode,
  InstituteProject,
  Role,
  SubRole,
  RolePermission,
  RoleSubRole,
  RoleSubRolePermission,
  Permission,
} = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name"],
        },
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },

        // Include system roles (global roles)
        {
          model: Role,
          as: "roles",
          through: { attributes: [] }, 
          include: [
            {
              model: RolePermission,
              as: "rolePermissions",
              include: [{ model: Permission, as: "permission" }],
            },
          ],
        },
      ],
    });

    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });
    if (!user.is_active)
      return res.status(403).json({ message: "User inactive" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    // Load project roles with permissions
    const projectRoles = await ProjectUserRole.findAll({
      where: { user_id: user.user_id, is_active: true },
      include: [
        {
          model: Role,
          as: "role",
          include: [
            {
              model: RoleSubRole,
              as: "roleSubRoles",
              include: [
                { model: SubRole, as: "subRole" },
                {
                  model: RoleSubRolePermission,
                  as: "permissions",
                  include: [{ model: Permission, as: "permission" }],
                },
              ],
            },

            {
              model: RolePermission,
              as: "rolePermissions",
              include: [{ model: Permission, as: "permission" }],
            },
          ],
        },
        {
          model: SubRole,
          as: "subRole",
          required: false,
        },
        {
          model: Project,
          as: "project",
          attributes: ["project_id", "name", "description"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: [
            "hierarchy_node_id",
            "name",
            "level",
            "parent_id",
            "description",
          ],
        },
        {
          model: InstituteProject,
          as: "instituteProject",
          attributes: ["institute_project_id", "institute_id"],
        },
      ],
    });

    // EXTRACT ALL PERMISSIONS (system + project)
  // Extract system permissions
const systemPermissions =
  user.roles?.flatMap((r) =>
    r.rolePermissions?.map(
      (p) => `${p.permission.resource}:${p.permission.action}`
    ) || []
  ) || [];

// Extract project permissions
const projectPermissions = projectRoles.flatMap((pr) =>
  pr.role?.rolePermissions?.map(
    (p) => `${p.permission.resource}:${p.permission.action}`
  ) || []
);


    
    const allPermissions = Array.from(
      new Set([...systemPermissions, ...projectPermissions])
    );

   
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        user_type: user.userType?.name || null,
        permissions: allPermissions, 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_TIME || "12h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      permissions: allPermissions,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        user_type: user.userType?.name || null,
        institute: user.institute
          ? {
              institute_id: user.institute.institute_id,
              name: user.institute.name,
            }
          : null,
          permissions: allPermissions,
          roles: user.roles?.map((r) => r.name) || [],
        phone_number: user.phone_number,
        position: user.position,
        profile_image: user.profile_image,
        // 🟢 Return project roles, formatted nicely for frontend
        project_roles: projectRoles?.map((pr) => ({
          project_user_role_id: pr.project_user_role_id,
          project: pr.project
            ? {
                project_id: pr.project.project_id,
                name: pr.project.name,
                description: pr.project.description,
              }
            : null,
          role: pr.role ? pr.role.name : null,
          role_id: pr.role ? pr.role.role_id : null,
          sub_role: pr.subRole ? pr.subRole.name : null,
          sub_role_id: pr.subRole ? pr.subRole.sub_role_id : null,

          hierarchy_node: pr.hierarchyNode
            ? {
                hierarchy_node_id: pr.hierarchyNode.hierarchy_node_id,
                name: pr.hierarchyNode.name,
                level: pr.hierarchyNode.level,
                parent_id: pr.hierarchyNode.parent_id,
                description: pr.hierarchyNode.description,
              }
            : null,

          institute_project: pr.instituteProject
            ? {
                institute_project_id: pr.instituteProject.institute_project_id,
                institute_id: pr.instituteProject.institute_id,
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
// Logout (token invalidation example using a blacklist)
const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: { user_id: decoded.user_id },

      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name"],
        },
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },

        // Include system roles (global roles)
        {
          model: Role,
          as: "roles",
          through: { attributes: [] },
          include: [
            {
              model: RolePermission,
              as: "rolePermissions",
              include: [{ model: Permission, as: "permission" }],
            },
          ],
        },
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Load project roles with permissions
    const projectRoles = await ProjectUserRole.findAll({
      where: { user_id: user.user_id, is_active: true },
      include: [
        {
          model: Role,
          as: "role",
          include: [
            {
              model: RoleSubRole,
              as: "roleSubRoles",
              include: [
                { model: SubRole, as: "subRole" },
                {
                  model: RoleSubRolePermission,
                  as: "permissions",
                  include: [{ model: Permission, as: "permission" }],
                },
              ],
            },

            {
              model: RolePermission,
              as: "rolePermissions",
              include: [{ model: Permission, as: "permission" }],
            },
          ],
        },
        {
          model: SubRole,
          as: "subRole",
          required: false,
        },
        {
          model: Project,
          as: "project",
          attributes: ["project_id", "name", "description"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: [
            "hierarchy_node_id",
            "name",
            "level",
            "parent_id",
            "description",
          ],
        },
        {
          model: InstituteProject,
          as: "instituteProject",
          attributes: ["institute_project_id", "institute_id"],
        },
      ],
    });

    // EXTRACT ALL PERMISSIONS (system + project)
    // Extract system permissions
    const systemPermissions =
      user.roles?.flatMap((r) =>
        r.rolePermissions?.map(
          (p) => `${p.permission.resource}:${p.permission.action}`
        ) || []
      ) || [];

    // Extract project permissions
    const projectPermissions = projectRoles.flatMap((pr) =>
      pr.role?.rolePermissions?.map(
        (p) => `${p.permission.resource}:${p.permission.action}`
      ) || []
    );

    const allPermissions = Array.from(
      new Set([...systemPermissions, ...projectPermissions])
    );

    return res.status(200).json({
      permissions: allPermissions,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        position: user.position,
        profile_image: user.profile_image,

        user_type: user.userType ? user.userType.name : null,

        institute: user.institute
          ? {
              institute_id: user.institute.institute_id,
              name: user.institute.name,
            }
          : null,

        // 🟢 Return project roles, formatted nicely for frontend
        project_roles: projectRoles?.map((pr) => ({
          project_user_role_id: pr.project_user_role_id,
          project: pr.project
            ? {
                project_id: pr.project.project_id,
                name: pr.project.name,
                description: pr.project.description,
              }
            : null,
          role: pr.role ? pr.role.name : null,
          role_id: pr.role ? pr.role.role_id : null,
          sub_role: pr.subRole ? pr.subRole.name : null,
          sub_role_id: pr.subRole ? pr.subRole.sub_role_id : null,

          hierarchy_node: pr.hierarchyNode
            ? {
                hierarchy_node_id: pr.hierarchyNode.hierarchy_node_id,
                name: pr.hierarchyNode.name,
                level: pr.hierarchyNode.level,
                parent_id: pr.hierarchyNode.parent_id,
                description: pr.hierarchyNode.description,
              }
            : null,

          institute_project: pr.instituteProject
            ? {
                institute_project_id: pr.instituteProject.institute_project_id,
                institute_id: pr.instituteProject.institute_id,
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { login, logout, getCurrentUser };
