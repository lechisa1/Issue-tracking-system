"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // First get all roles and sub-roles
    const roles = await queryInterface.sequelize.query(
      'SELECT role_id, name FROM roles;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const subRoles = await queryInterface.sequelize.query(
      'SELECT sub_role_id, name FROM sub_roles;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const roleSubRoles = [];

    // Helper function to find ID by name
    const findIdByName = (array, name) => {
      const item = array.find(item => item.name.includes(name));
      return item ? item.role_id || item.sub_role_id : null;
    };

    // Link Developer role to developer sub-roles
    const developerRoleId = findIdByName(roles, 'Developer');
    if (developerRoleId) {
      ['Backend Developer', 'Frontend Developer', 'Mobile Developer', 'Full Stack Developer'].forEach(subRoleName => {
        const subRoleId = findIdByName(subRoles, subRoleName);
        if (subRoleId) {
          roleSubRoles.push({
            roles_sub_roles_id: uuidv4(),
            role_id: developerRoleId,
            sub_role_id: subRoleId,
            is_active: true,
            created_at: now,
            updated_at: now,
          });
        }
      });
    }

    // Link Quality Assurance role to QA sub-roles
    const qaRoleId = findIdByName(roles, 'Quality Assurance');
    if (qaRoleId) {
      ['QA Director', 'QA Lead', 'QA Engineer'].forEach(subRoleName => {
        const subRoleId = findIdByName(subRoles, subRoleName);
        if (subRoleId) {
          roleSubRoles.push({
            roles_sub_roles_id: uuidv4(),
            role_id: qaRoleId,
            sub_role_id: subRoleId,
            is_active: true,
            created_at: now,
            updated_at: now,
          });
        }
      });
    }

    // Link ICT Support role to ICT sub-roles
    const ictRoleId = findIdByName(roles, 'ICT Support');
    if (ictRoleId) {
      ['ICT Support L1', 'ICT Support L2', 'ICT Support L3'].forEach(subRoleName => {
        const subRoleId = findIdByName(subRoles, subRoleName);
        if (subRoleId) {
          roleSubRoles.push({
            roles_sub_roles_id: uuidv4(),
            role_id: ictRoleId,
            sub_role_id: subRoleId,
            is_active: true,
            created_at: now,
            updated_at: now,
          });
        }
      });
    }

    // Link Administration role to admin sub-roles
    const adminRoleId = findIdByName(roles, 'Administration');
    if (adminRoleId) {
      ['System Administrator', 'User Administrator'].forEach(subRoleName => {
        const subRoleId = findIdByName(subRoles, subRoleName);
        if (subRoleId) {
          roleSubRoles.push({
            roles_sub_roles_id: uuidv4(),
            role_id: adminRoleId,
            sub_role_id: subRoleId,
            is_active: true,
            created_at: now,
            updated_at: now,
          });
        }
      });
    }

    // Project Manager role doesn't need specific sub-roles
    const pmRoleId = findIdByName(roles, 'Project Manager');
    if (pmRoleId) {
      roleSubRoles.push({
        roles_sub_roles_id: uuidv4(),
        role_id: pmRoleId,
        sub_role_id: null, // No specific sub-role for Project Manager
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert("role_sub_roles", roleSubRoles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("role_sub_roles", null, {});
  },
};