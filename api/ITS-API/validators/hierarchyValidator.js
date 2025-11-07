const Joi = require("joi");

// Create Hierarchy validation
const createHierarchySchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 255 characters",
  }),
  project_id: Joi.string().uuid().required().messages({
    "string.guid": "Project ID must be a valid UUID",
    "any.required": "Project ID is required",
  }),
  description: Joi.string().max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
  is_active: Joi.boolean().optional(),
});

// Update Hierarchy validation
const updateHierarchySchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  project_id: Joi.string().uuid().optional(),
  description: Joi.string().max(1000).optional(),
  is_active: Joi.boolean().optional(),
});

exports.validateCreateHierarchy = (req, res, next) => {
  const { error } = createHierarchySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateHierarchy = (req, res, next) => {
  const { error } = updateHierarchySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
