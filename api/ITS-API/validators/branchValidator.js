const Joi = require("joi");

// Create Branch validation
const createBranchSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),
  region_id: Joi.string().uuid().required().messages({
    "string.guid": "Region ID must be a valid UUID",
    "any.required": "Region ID is required",
  }),
  city_id: Joi.string().uuid().required().messages({
    "string.guid": "City ID must be a valid UUID",
    "any.required": "City ID is required",
  }),
  zone_id: Joi.string().uuid().required().messages({
    "string.guid": "Zone ID must be a valid UUID",
    "any.required": "Zone ID is required",
  }),
  sub_city_id: Joi.string().uuid().required().messages({
    "string.guid": "Sub-city ID must be a valid UUID",
    "any.required": "Sub-city ID is required",
  }),
  woreda_id: Joi.string().uuid().required().messages({
    "string.guid": "Woreda ID must be a valid UUID",
    "any.required": "Woreda ID is required",
  }),
  organization_id: Joi.string().uuid().required().messages({
    "string.guid": "Organization ID must be a valid UUID",
    "any.required": "Organization ID is required",
  }),
  
  description: Joi.string().max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
});

// Update Branch validation
const updateBranchSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  region_id: Joi.string().uuid().optional(),
  city_id: Joi.string().uuid().optional(),
  sub_city_id: Joi.string().uuid().optional(),
  woreda_id: Joi.string().uuid().optional(),
  description: Joi.string().max(1000).optional(),
});

exports.validateCreateBranch = (req, res, next) => {
  const { error } = createBranchSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateBranch = (req, res, next) => {
  const { error } = updateBranchSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};
