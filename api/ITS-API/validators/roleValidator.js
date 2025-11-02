const Joi = require("joi");

const createRoleSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Role name is required",
  }),

  description: Joi.string().trim().required().messages({
    "string.empty": "Role description is required",
  }),

  level: Joi.string()
    .valid("internal", "external")
    .required()
    .messages({
      "any.only": "Role type must be either 'internal' or 'external'",
      "string.empty": "Role type is required",
    }),

  permissions: Joi.array()
    .items(Joi.string().guid({ version: "uuidv4" }))
    .optional()
    .messages({
      "string.guid": "Each permission must be a valid UUID",
    }),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().optional(),
  level: Joi.string().valid("internal", "external").optional(),
  permissions: Joi.array()
    .items(Joi.string().guid({ version: "uuidv4" }))
    .optional(),
});

exports.validateCreateRole = (req, res, next) => {
  const { error } = createRoleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateRole = (req, res, next) => {
  const { error } = updateRoleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};