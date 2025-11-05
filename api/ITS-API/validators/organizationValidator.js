const Joi = require("joi");

// Create organization validation
const createOrganizationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),

  has_branch: Joi.boolean().required().messages({
    "boolean.base": "Has branch must be a boolean value",
    "any.required": "Has branch is required",
  }),

  description: Joi.string().max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
});

// Update organization validation
const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  has_branch: Joi.boolean().optional(),
  description: Joi.string().max(1000).optional(),
});

exports.validateCreateOrganization = (req, res, next) => {
  const { error } = createOrganizationSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateOrganization = (req, res, next) => {
  const { error } = updateOrganizationSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};
