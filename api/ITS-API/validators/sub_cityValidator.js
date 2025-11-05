const Joi = require("joi");

// Create Sub_city validation
const createSub_citySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),
  city_id: Joi.string().uuid().required().messages({
    "string.guid": "City ID must be a valid UUID",
    "any.required": "City ID is required",
  }),
  description: Joi.string().max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
});

// Update Sub_city validation
const updateSub_citySchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  city_id: Joi.string().uuid().optional(),
  description: Joi.string().max(1000).optional(),
});

exports.validateCreateSub_city = (req, res, next) => {
  const { error } = createSub_citySchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateSub_city = (req, res, next) => {
  const { error } = updateSub_citySchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};
