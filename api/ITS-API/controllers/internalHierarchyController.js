const { InternalHierarchy, sequelize } = require("../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");

// ============ Get All Hierarchy Nodes ============
const getInternalHierarchies = async (req, res) => {
  try {
    const hierarchies = await InternalHierarchy.findAll({
      include: [
        { model: InternalHierarchy, as: "parent", attributes: ["id", "name", "code"] },
        { model: InternalHierarchy, as: "children", attributes: ["id", "name", "code"] },
      ],
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Hierarchy nodes fetched successfully",
      data: hierarchies,
    });
  } catch (error) {
    console.error("Error fetching hierarchy nodes:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Get Hierarchy Node by ID ============
const getInternalHierarchyById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id))
      return res.status(400).json({ success: false, message: "Invalid ID format" });

    const node = await InternalHierarchy.findByPk(id, {
      include: [
        { model: InternalHierarchy, as: "parent", attributes: ["id", "name", "code"] },
        { model: InternalHierarchy, as: "children", attributes: ["id", "name", "code"] },
      ],
    });

    if (!node)
      return res.status(404).json({ success: false, message: "Hierarchy node not found" });

    return res.status(200).json({ success: true, data: node });
  } catch (error) {
    console.error("Error fetching hierarchy node:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Create Hierarchy Node ============
const createInternalHierarchy = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, code, parent_id, is_active } = req.body;

    // Validate parent if provided
    if (parent_id) {
      const parent = await InternalHierarchy.findByPk(parent_id, { transaction: t });
      if (!parent) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Invalid parent_id" });
      }
    }

    const node = await InternalHierarchy.create(
      {
        id: uuidv4(),
        name,
        code: code || null,
        parent_id: parent_id || null,
        is_active: is_active ?? true,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ success: true, data: node });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error creating hierarchy node:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Update Hierarchy Node ============
const updateInternalHierarchy = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, code, parent_id, is_active } = req.body;

    if (!isUuid(id))
      return res.status(400).json({ success: false, message: "Invalid ID format" });

    const node = await InternalHierarchy.findByPk(id, { transaction: t });
    if (!node) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Hierarchy node not found" });
    }

    // Validate parent
    if (parent_id) {
      const parent = await InternalHierarchy.findByPk(parent_id, { transaction: t });
      if (!parent) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Invalid parent_id" });
      }
    }

    await node.update(
      {
        name: name ?? node.name,
        code: code ?? node.code,
        parent_id: parent_id ?? node.parent_id,
        is_active: is_active ?? node.is_active,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(200).json({ success: true, data: node });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error updating hierarchy node:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Soft Delete Hierarchy Node ============
const deleteInternalHierarchy = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUuid(id))
      return res.status(400).json({ success: false, message: "Invalid ID format" });

    const node = await InternalHierarchy.findByPk(id, { transaction: t });
    if (!node) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Hierarchy node not found" });
    }

    await node.update({ is_active: false }, { transaction: t });
    await t.commit();

    return res.status(200).json({ success: true, message: "Hierarchy node deactivated successfully" });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error deleting hierarchy node:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInternalHierarchies,
  getInternalHierarchyById,
  createInternalHierarchy,
  updateInternalHierarchy,
  deleteInternalHierarchy,
};
