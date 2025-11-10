// controllers/roleController.js
const {
  Role,
  SubRole,
  RoleSubRole,
  RoleSubRolePermission,
  Permission,
  ProjectUserRole,
  RolePermission,
} = require("../models");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");

const createRole = async (req, res) => {
  const t = await Role.sequelize.transaction();
  try {
    const { name, description, sub_roles, permission_ids } = req.body;
    // `permission_ids` is only used when there are no sub_roles

    // ====== Check if role exists ======
    const existing = await Role.findOne({ where: { name }, transaction: t });
    if (existing) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Role name already exists",
      });
    }

    // ====== Create Role ======
    const role = await Role.create(
      {
        role_id: uuidv4(),
        name,
        description,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    // ====== Case 1: If sub-roles exist ======
    if (Array.isArray(sub_roles) && sub_roles.length > 0) {
      for (const sr of sub_roles) {
        // Validate sub-role
        const subRole = await SubRole.findOne({
          where: { sub_role_id: sr.sub_role_id, is_active: true },
          transaction: t,
        });

        if (!subRole) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: `Invalid or inactive sub-role ID: ${sr.sub_role_id}`,
          });
        }

        // Create RoleSubRole link
        const roleSubRole = await RoleSubRole.create(
          {
            roles_sub_roles_id: uuidv4(),
            role_id: role.role_id,
            sub_role_id: sr.sub_role_id,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          { transaction: t }
        );

        // Attach permissions to the RoleSubRole
        if (sr.permission_ids && sr.permission_ids.length > 0) {
          let permissionIds = sr.permission_ids;
          if (typeof permissionIds === "string") {
            try {
              permissionIds = JSON.parse(permissionIds);
            } catch {
              permissionIds = permissionIds.split(",").map((i) => i.trim());
            }
          }

          const validPermissions = await Permission.findAll({
            where: { permission_id: permissionIds, is_active: true },
            transaction: t,
          });

          if (validPermissions.length !== permissionIds.length) {
            await t.rollback();
            return res.status(400).json({
              success: false,
              message: "Some permissions are invalid for sub-role",
            });
          }

          const roleSubRolePerms = permissionIds.map((pid) => ({
            role_sub_roles_permission_id: uuidv4(),
            roles_sub_roles_id: roleSubRole.roles_sub_roles_id,
            permission_id: pid,
            assigned_by: "system",
            assigned_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          }));

          await RoleSubRolePermission.bulkCreate(roleSubRolePerms, {
            transaction: t,
          });
        }
      }
    }

    // ====== Case 2: If NO sub-roles, assign permissions directly to role ======
    else if (permission_ids && permission_ids.length > 0) {
      let permissionIds = permission_ids;
      if (typeof permissionIds === "string") {
        try {
          permissionIds = JSON.parse(permissionIds);
        } catch {
          permissionIds = permissionIds.split(",").map((i) => i.trim());
        }
      }

      const validPermissions = await Permission.findAll({
        where: { permission_id: permissionIds, is_active: true },
        transaction: t,
      });

      if (validPermissions.length !== permissionIds.length) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Some permissions are invalid for role",
        });
      }

      const rolePermissions = permissionIds.map((pid) => ({
        role_permission_id: uuidv4(),
        role_id: role.role_id,
        permission_id: pid,
        assigned_by: "system",
        assigned_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await RolePermission.bulkCreate(rolePermissions, { transaction: t });
    }

    await t.commit();

    // ====== Fetch created role with relationships ======
    const createdRole = await Role.findOne({
      where: { role_id: role.role_id },
      include: [
        {
          model: RoleSubRole,
          as: "roleSubRoles",
          include: [
            {
              model: SubRole,
              as: "subRole",
            },
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
    });

    return res.status(201).json({
      success: true,
      message:
        "Role created successfully (with sub-roles or direct permissions)",
      data: createdRole,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error creating role:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating role",
      error: error.message,
    });
  }
};

// Get all roles with sub-roles and permissions
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: { is_active: true },
      include: [
        {
          model: RoleSubRole,
          as: "roleSubRoles",
          where: { is_active: true },
          required: false,
          include: [
            {
              model: SubRole,
              as: "subRole",
              attributes: ["sub_role_id", "name", "description"],
            },
            {
              model: RoleSubRolePermission,
              as: "permissions",
              include: [
                {
                  model: Permission,
                  as: "permission",
                  attributes: ["permission_id", "resource", "action"],
                },
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findOne({
      where: {
        role_id: id,
        is_active: true,
      },
      include: [
        {
          model: RoleSubRole,
          as: "roleSubRoles",
          where: { is_active: true },
          required: false,
          include: [
            {
              model: SubRole,
              as: "subRole",
              attributes: ["sub_role_id", "name", "description"],
            },
            {
              model: RoleSubRolePermission,
              as: "permissions",
              include: [
                {
                  model: Permission,
                  as: "permission",
                  attributes: ["permission_id", "resource", "action"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Role
const updateRole = async (req, res) => {
  const t = await Role.sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, description, sub_roles } = req.body;

    // Find the role
    const role = await Role.findOne({
      where: {
        role_id: id,
        is_active: true,
      },
      transaction: t,
    });

    if (!role) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({
        where: { name },
        transaction: t,
      });

      if (existingRole) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Role name already exists",
        });
      }
    }

    // Update role basic info
    await role.update(
      {
        name: name || role.name,
        description: description || role.description,
        updated_at: new Date(),
      },
      { transaction: t }
    );

    // Update sub-roles and permissions if provided
    if (Array.isArray(sub_roles)) {
      // Soft delete existing role-subrole associations
      await RoleSubRole.update(
        {
          is_active: false,
          deleted_at: new Date(),
          updated_at: new Date(),
        },
        {
          where: { role_id: id },
          transaction: t,
        }
      );

      // Soft delete existing permissions for this role
      const existingRoleSubRoles = await RoleSubRole.findAll({
        where: { role_id: id },
        transaction: t,
      });

      if (existingRoleSubRoles.length > 0) {
        const roleSubRoleIds = existingRoleSubRoles.map(
          (rsr) => rsr.roles_sub_roles_id
        );

        await RoleSubRolePermission.update(
          {
            updated_at: new Date(),
          },
          {
            where: { roles_sub_roles_id: roleSubRoleIds },
            transaction: t,
          }
        );
      }

      // Create new sub-role associations
      if (sub_roles.length > 0) {
        for (const sr of sub_roles) {
          // Validate sub-role exists and is active
          const subRole = await SubRole.findOne({
            where: {
              sub_role_id: sr.sub_role_id,
              is_active: true,
            },
            transaction: t,
          });

          if (!subRole) {
            await t.rollback();
            return res.status(400).json({
              success: false,
              message: `Invalid or inactive sub-role ID: ${sr.sub_role_id}`,
            });
          }

          // Create new RoleSubRole association
          const roleSubRole = await RoleSubRole.create(
            {
              roles_sub_roles_id: uuidv4(),
              role_id: id,
              sub_role_id: sr.sub_role_id,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
            { transaction: t }
          );

          // Assign permissions if provided
          if (sr.permission_ids && sr.permission_ids.length > 0) {
            const validPermissions = await Permission.findAll({
              where: { permission_id: sr.permission_ids },
              transaction: t,
            });

            if (validPermissions.length !== sr.permission_ids.length) {
              await t.rollback();
              return res.status(400).json({
                success: false,
                message: "Some permissions are invalid",
              });
            }

            const roleSubRolePerms = sr.permission_ids.map((pid) => ({
              role_sub_roles_permission_id: uuidv4(),
              roles_sub_roles_id: roleSubRole.roles_sub_roles_id,
              permission_id: pid,
              assigned_by: req.user.user_id,
              assigned_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            }));

            await RoleSubRolePermission.bulkCreate(roleSubRolePerms, {
              transaction: t,
            });
          }
        }
      }
    }

    await t.commit();

    // Fetch updated role with relationships
    const updatedRole = await Role.findOne({
      where: { role_id: id },
      include: [
        {
          model: RoleSubRole,
          as: "roleSubRoles",
          where: { is_active: true },
          required: false,
          include: [
            {
              model: SubRole,
              as: "subRole",
            },
            {
              model: RoleSubRolePermission,
              as: "permissions",
              include: [
                {
                  model: Permission,
                  as: "permission",
                },
              ],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error updating role:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating role",
      error: error.message,
    });
  }
};

// Delete Role (Soft Delete)
const deleteRole = async (req, res) => {
  const t = await Role.sequelize.transaction();
  try {
    const { id } = req.params;

    // Find the role
    const role = await Role.findOne({
      where: {
        role_id: id,
        is_active: true,
      },
      transaction: t,
    });

    if (!role) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if role is being used in project user roles
    const roleInUse = await ProjectUserRole.findOne({
      where: {
        role_id: id,
        is_active: true,
      },
      transaction: t,
    });

    if (roleInUse) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete role. It is currently assigned to users in projects.",
      });
    }

    // Soft delete the role
    await role.update(
      {
        is_active: false,
        deleted_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    // Soft delete related role-subrole associations
    await RoleSubRole.update(
      {
        is_active: false,
        deleted_at: new Date(),
        updated_at: new Date(),
      },
      {
        where: { role_id: id },
        transaction: t,
      }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error deleting role:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting role",
      error: error.message,
    });
  }
};

// Get all sub-roles for a specific role
const getSubRolesByRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findOne({
      where: {
        role_id: id,
        is_active: true,
      },
      include: [
        {
          model: RoleSubRole,
          as: "roleSubRoles",
          where: { is_active: true },
          required: false,
          include: [
            {
              model: SubRole,
              as: "subRole",
              attributes: ["sub_role_id", "name", "description"],
            },
          ],
        },
      ],
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const subRoles = role.roleSubRoles.map((rsr) => rsr.subRole);

    return res.status(200).json({
      success: true,
      data: subRoles,
    });
  } catch (error) {
    console.error("Error fetching sub-roles:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all permissions for a specific role and sub-role combination
const getPermissionsByRoleSubRole = async (req, res) => {
  try {
    const { roleId, subRoleId } = req.params;

    const roleSubRole = await RoleSubRole.findOne({
      where: {
        role_id: roleId,
        sub_role_id: subRoleId,
        is_active: true,
      },
      include: [
        {
          model: RoleSubRolePermission,
          as: "permissions",
          include: [
            {
              model: Permission,
              as: "permission",
              attributes: ["permission_id", "resource", "action"],
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
      ],
    });

    if (!roleSubRole) {
      return res.status(404).json({
        success: false,
        message: "Role-subrole combination not found",
      });
    }

    const permissions = roleSubRole.permissions.map((perm) => perm.permission);

    return res.status(200).json({
      success: true,
      data: {
        role: roleSubRole.role,
        subRole: roleSubRole.subRole,
        permissions: permissions,
      },
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getSubRolesByRole,
  getPermissionsByRoleSubRole,
};
