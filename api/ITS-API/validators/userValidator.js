const Joi = require("joi");

// Create user validation
const createUserSchema = Joi.object({
  full_name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 3 characters",
  }),

  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),

  user_type_id: Joi.string()
    .guid({ version: "uuidv4" })
    .required()
    .messages({
      "string.guid": "User type ID must be a valid UUID",
      "any.required": "User type ID is required",
    }),

  position: Joi.string().max(100).optional().messages({
    "string.max": "Position cannot exceed 100 characters",
  }),

  role_ids: Joi.array()
    .items(Joi.string().guid({ version: "uuidv4" }))
    .optional()
    .messages({
      "string.guid": "Each role ID must be a valid UUID",
    }),

  assigned_by: Joi.string()
    .guid({ version: "uuidv4" })
    .optional()
    .messages({
      "string.guid": "Assigned by must be a valid UUID",
    }),
});

// Update user validation
const updateUserSchema = Joi.object({
  full_name: Joi.string().min(3).max(100).optional(),
  email: Joi.string().email().optional(),
  user_type_id: Joi.string().guid({ version: "uuidv4" }).optional(),
  position: Joi.string().optional(),
  is_active: Joi.boolean().optional(),
});

exports.validateCreateUser = (req, res, next) => {
  const { error } = createUserSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateUser = (req, res, next) => {
  const { error } = updateUserSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};
