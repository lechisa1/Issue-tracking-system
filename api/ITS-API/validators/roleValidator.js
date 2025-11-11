const Joi = require("joi");

// Schema for creating a Role
const createRoleSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Role name is required",
  }),

  description: Joi.string().trim().required().messages({
    "string.empty": "Role description is required",
  }),

  permission_ids: Joi.alternatives()
    .try(
      Joi.array().items(
        Joi.string().guid({ version: "uuidv4" }).messages({
          "string.guid": "Each permission_id must be a valid UUID",
        })
      ),
      Joi.string()
    )
    .optional()
    .messages({
      "array.includes": "permission_ids must be a list of UUIDs",
    }),

  sub_roles: Joi.array()
    .items(
      Joi.object({
        sub_role_id: Joi.string()
          .guid({ version: "uuidv4" })
          .required()
          .messages({
            "string.guid": "Each sub_role_id must be a valid UUID",
            "any.required": "sub_role_id is required for each sub-role",
          }),

        permission_ids: Joi.alternatives()
          .try(
            Joi.array().items(
              Joi.string().guid({ version: "uuidv4" }).messages({
                "string.guid": "Each permission_id must be a valid UUID",
              })
            ),
            Joi.string()
          )
          .optional()
          .messages({
            "array.includes": "permission_ids must be a list of UUIDs",
          }),
      })
    )
    .optional()
    .messages({
      "array.base": "sub_roles must be an array",
    }),
});

// Middleware wrappers
exports.validateCreateRole = (req, res, next) => {
  const { error } = createRoleSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((e) => e.message),
    });
  next();
};

// Schema for updating a Role
const updateRoleSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().optional(),
  sub_roles: Joi.array()
    .items(
      Joi.object({
        sub_role_id: Joi.string()
          .guid({ version: "uuidv4" })
          .required()
          .messages({
            "string.guid": "Each sub_role_id must be a valid UUID",
          }),

        permission_ids: Joi.alternatives()
          .try(
            Joi.array().items(
              Joi.string().guid({ version: "uuidv4" }).messages({
                "string.guid": "Each permission_id must be a valid UUID",
              })
            ),
            Joi.string()
          )
          .optional(),
      })
    )
    .optional(),
});

// Middleware wrappers
exports.validateCreateRole = (req, res, next) => {
  const { error } = createRoleSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((e) => e.message),
    });
  next();
};

exports.validateUpdateRole = (req, res, next) => {
  const { error } = updateRoleSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((e) => e.message),
    });
  next();
};
