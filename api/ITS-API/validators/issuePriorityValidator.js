const Joi = require("joi");

// Schema for creating/updating priority
exports.prioritySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.base": "Priority name must be a string",
    "string.empty": "Priority name is required",
    "string.min": "Priority name must be at least 2 characters long",
    "string.max": "Priority name must not exceed 100 characters",
    "any.required": "Priority name is required",
  }),
  description: Joi.string().trim().max(255).allow("", null).messages({
    "string.max": "Description must not exceed 255 characters",
  }),
});

// Schema for validating UUID in route params
exports.idParamSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .required()
    .messages({
      "string.guid": "Invalid UUID format",
      "any.required": "ID parameter is required",
    }),
});
