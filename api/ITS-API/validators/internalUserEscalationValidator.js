const Joi = require("joi");

const createEscalationSchema = Joi.object({
  escalation_id: Joi.string().uuid().optional(),
  issue_id: Joi.string().uuid().required().messages({
    "any.required": "Issue ID is required.",
  }),
  from_tier: Joi.string().uuid().required().messages({
    "any.required": "From tier is required.",
  }),
  to_tier: Joi.string().uuid().allow(null).optional(),
  escalated_by: Joi.string().uuid().required().messages({
    "any.required": "Escalated by is required.",
  }),
  action_type: Joi.string().valid("escalate", "resolve","broadcasted" ,"return").optional(),
  action_note: Joi.string().allow(null, "").optional(),
  due_date_in_days: Joi.number().integer().min(0).optional(),
  attachmentsMeta: Joi.array().items(
    Joi.object({
      file_name: Joi.string().required(),
      mime_type: Joi.string().optional(),
      file_size: Joi.number().optional(),
      uploaded_by: Joi.string().optional(),
    })
  ).optional(),
  comments: Joi.alternatives().try(Joi.string(), Joi.array()).optional(),
});

const validateCreateEscalation = (req, res, next) => {
  const { error } = createEscalationSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      errors: error.details.map((err) => err.message)
    });
  }
  next();
};

module.exports = {
  validateCreateEscalation,
};
