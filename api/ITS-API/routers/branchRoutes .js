const express = require("express");
const router = express.Router();
const BranchController = require("../controllers/branchController");
const {
  validateCreateBranch,
  validateUpdateBranch,
} = require("../validators/branchValidator");

//  endpoints for Branches

router.post("/", validateCreateBranch, BranchController.createBranch);
router.get("/", BranchController.getBranches);
router.get("/:id", BranchController.getBranchById);
router.put("/:id", validateUpdateBranch, BranchController.updateBranch);
router.delete("/:id", BranchController.deleteBranch);

module.exports = router;
