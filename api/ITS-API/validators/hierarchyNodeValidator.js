const Joi = require("joi");

// Schema for creating a hierarchy node (supports nested children)
const hierarchyNodeSchema = Joi.object({
  hierarchy_id: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.guid": "Hierarchy ID must be a valid UUID",
    "any.required": "Hierarchy ID is required",
  }),
  parent_id: Joi.string()
    .guid({ version: "uuidv4" })
    .allow(null)
    .optional()
    .messages({
      "string.guid": "Parent ID must be a valid UUID",
    }),
  name: Joi.string().trim().max(255).required().messages({
    "string.empty": "Node name is required",
    "string.max": "Node name must be at most 255 characters",
  }),
  description: Joi.string().trim().optional(),
  is_active: Joi.boolean().optional(),
  children: Joi.array().items(Joi.link("#nodeSchema")).optional(),
}).id("nodeSchema");

// Schema for updating a hierarchy node
const updateHierarchyNodeSchema = Joi.object({
  hierarchy_id: Joi.string().guid({ version: "uuidv4" }).optional(),
  parent_id: Joi.string().guid({ version: "uuidv4" }).allow(null).optional(),
  name: Joi.string().trim().max(255).optional(),
  description: Joi.string().trim().optional(),
  is_active: Joi.boolean().optional(),
});

// Validate create (handles both array and single)
exports.validateCreateHierarchyNode = (req, res, next) => {
  const input = req.body;
  const schema = Array.isArray(input)
    ? Joi.array().items(hierarchyNodeSchema)
    : hierarchyNodeSchema;

  const { error } = schema.validate(input, { allowUnknown: false });
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

// Validate update
exports.validateUpdateHierarchyNode = (req, res, next) => {
  const { error } = updateHierarchyNodeSchema.validate(req.body, {
    allowUnknown: false,
  });
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

// Validate ID param
exports.validateHierarchyNodeId = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string().guid({ version: "uuidv4" }).required().messages({
      "string.guid": "Hierarchy Node ID must be a valid UUID",
      "any.required": "Hierarchy Node ID is required",
    }),
  });

  const { error } = schema.validate(req.params, { allowUnknown: false });
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateParentNodesQuery = (req, res, next) => {
  const Joi = require("joi");

  const schema = Joi.object({
    hierarchy_id: Joi.string()
      .guid({ version: ["uuidv4", "uuidv5"] })
      .required()
      .messages({
        "string.guid": "Hierarchy ID must be a valid UUID",
        "any.required": "Hierarchy ID is required",
      }),
  });

  const { error } = schema.validate(req.params, { allowUnknown: false }); // <-- params now

  if (error) return res.status(400).json({ error: error.details[0].message });

  next();
};
