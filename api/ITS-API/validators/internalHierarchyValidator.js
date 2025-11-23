const Joi = require("joi");

// =================== Create Schema ===================
const createHierarchySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(2).max(20).required(), // ✅ Example: QAL, QAM, DEV
  parent_id: Joi.string().guid({ version: "uuidv4" }).allow(null).optional(),
  is_active: Joi.boolean().optional(),
});

// =================== Update Schema ===================
const updateHierarchySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  code: Joi.string().min(2).max(20).optional(),
  parent_id: Joi.string().guid({ version: "uuidv4" }).allow(null).optional(),
  is_active: Joi.boolean().optional(),
});

// =================== Middleware ===================
exports.validateCreateHierarchy = (req, res, next) => {
  const { error } = createHierarchySchema.validate(req.body, { abortEarly: true });
  if (error)
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  next();
};

exports.validateUpdateHierarchy = (req, res, next) => {
  const { error } = updateHierarchySchema.validate(req.body, { abortEarly: true });
  if (error)
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  next();
};
