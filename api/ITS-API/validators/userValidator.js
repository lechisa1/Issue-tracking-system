const Joi = require("joi");

// =================== Create User Schema ===================
const createUserSchema = Joi.object({
  full_name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Full name is required.",
    "string.min": "Full name must be at least 3 characters long.",
  }),

  email: Joi.string().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Please provide a valid email address.",
  }),

  phone_number: Joi.string()
    .pattern(/^[0-9+\-()\s]{7,20}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required.",
      "string.pattern.base": "Please provide a valid phone number.",
    }),

  user_type_id: Joi.string()
    .guid({ version: "uuidv4" })
    .required()
    .messages({
      "string.guid": "User type ID must be a valid UUID.",
      "any.required": "User type ID is required.",
    }),

  institute_id: Joi.string()
    .guid({ version: "uuidv4" })
    .allow(null)
    .optional()
    .messages({
      "string.guid": "Institute ID must be a valid UUID.",
    }),

  position: Joi.string().max(100).optional().messages({
    "string.max": "Position cannot exceed 100 characters.",
  }),

  role_ids: Joi.array()
    .items(Joi.string().guid({ version: "uuidv4" }))
    .optional()
    .messages({
      "string.guid": "Each role ID must be a valid UUID.",
      "array.includes": "Role IDs must be an array of valid UUIDs.",
    }),

  assigned_by: Joi.string()
    .guid({ version: "uuidv4" })
    .allow(null)
    .optional()
    .messages({
      "string.guid": "Assigned by must be a valid UUID.",
    }),

  // =================== Projects ===================
  projects: Joi.array()
    .items(
      Joi.object({
        project_id: Joi.string().guid({ version: "uuidv4" }).required()
          .messages({
            "string.guid": "Project ID must be a valid UUID.",
            "any.required": "Project ID is required.",
          }),
        main_role: Joi.string().optional(),
        sub_role: Joi.string().optional(),
        role_id: Joi.string().guid({ version: "uuidv4" }).optional(),
        sub_role_id: Joi.string().guid({ version: "uuidv4" }).optional(),
      })
    )
    .optional()
    .messages({
      "array.base": "Projects must be an array of project objects.",
    }),
});

// =================== Update User Schema ===================
const updateUserSchema = Joi.object({
  full_name: Joi.string().min(3).max(100).optional(),
  email: Joi.string().email().optional(),
  phone_number: Joi.string().pattern(/^[0-9+\-()\s]{7,20}$/).optional(),
  user_type_id: Joi.string().guid({ version: "uuidv4" }).optional(),
  institute_id: Joi.string().guid({ version: "uuidv4" }).allow(null).optional(),
  position: Joi.string().max(100).optional(),
  is_active: Joi.boolean().optional(),
  role_ids: Joi.array().items(Joi.string().guid({ version: "uuidv4" })).optional(),
  assigned_by: Joi.string().guid({ version: "uuidv4" }).allow(null).optional(),
  projects: Joi.array()
    .items(
      Joi.object({
        project_id: Joi.string().guid({ version: "uuidv4" }).required(),
        main_role: Joi.string().optional(),
        sub_role: Joi.string().optional(),
        role_id: Joi.string().guid({ version: "uuidv4" }).optional(),
        sub_role_id: Joi.string().guid({ version: "uuidv4" }).optional(),
      })
    )
    .optional(),
});

// =================== Validators ===================
exports.validateCreateUser = (req, res, next) => {
  const { error } = createUserSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      status: "error",
      message: error.details[0].message,
    });
  }
  next();
};

exports.validateUpdateUser = (req, res, next) => {
  const { error } = updateUserSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      status: "error",
      message: error.details[0].message,
    });
  }
  next();
};
