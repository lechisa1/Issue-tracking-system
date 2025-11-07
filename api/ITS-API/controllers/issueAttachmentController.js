const { IssueAttachment } = require("../models");
const path = require("path");
const fs = require("fs");
const uploadMultipleAttachments = async (req, res) => {
  try {
    const { issue_id, replace = false } = req.body;
    const user_id = req.user.user_id;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const issueDir = path.join("uploads/issues", issue_id);
    if (!fs.existsSync(issueDir)) fs.mkdirSync(issueDir, { recursive: true });

    // If replace = true, delete existing attachments from DB and local storage
    if (replace) {
      const existingFiles = await IssueAttachment.findAll({
        where: { issue_id },
      });
      for (const file of existingFiles) {
        if (fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
        }
        await file.destroy(); // remove from database
      }
    }

    // Save new files
    const savedFiles = [];
    for (const file of req.files) {
      const newFilePath = path.join(issueDir, file.filename);
      fs.renameSync(file.path, newFilePath);

      const fileRecord = await IssueAttachment.create({
        issue_id,
        file_name: file.filename,
        file_path: newFilePath,
        uploaded_by: user_id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      savedFiles.push({
        file_name: fileRecord.file_name,
        file_path: fileRecord.file_path,
      });
    }

    return res.status(201).json({
      success: true,
      message: replace
        ? "Files replaced successfully"
        : "Files uploaded successfully",
      files: savedFiles,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error uploading files",
      error: error.message,
    });
  }
};
const deleteAttachments = async (req, res) => {
  try {
    const { issue_id } = req.body;
    const user_id = req.user.user_id;

    if (!issue_id) {
      return res.status(400).json({
        success: false,
        message: "issue_id is required",
      });
    }

    // Fetch all attachments for the given issue
    const attachments = await IssueAttachment.findAll({
      where: { issue_id },
    });

    if (attachments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attachments found for this issue",
      });
    }

    // Delete each file from local storage and DB
    for (const attachment of attachments) {
      if (fs.existsSync(attachment.file_path)) {
        fs.unlinkSync(attachment.file_path);
      }
      await attachment.destroy();
    }

    return res.status(200).json({
      success: true,
      message: `All ${attachments.length} attachments deleted successfully`,
      deleted_by: user_id,
    });
  } catch (error) {
    console.error("Error deleting attachments:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting attachments",
      error: error.message,
    });
  }
};
const getAttachmentsByIssueId = async (req, res) => {
  try {
    const { issue_id } = req.params;

    if (!issue_id) {
      return res.status(400).json({
        success: false,
        message: "issue_id is required",
      });
    }

    const attachments = await IssueAttachment.findAll({
      where: { issue_id },
      attributes: ["file_name", "file_path", "uploaded_by", "created_at"],
      order: [["created_at", "DESC"]],
    });

    if (!attachments || attachments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attachments found for this issue",
      });
    }

    return res.status(200).json({
      success: true,
      count: attachments.length,
      attachments,
    });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching attachments",
      error: error.message,
    });
  }
};
const deleteAttachmentById = async (req, res) => {
  try {
    const { attachment_id } = req.params;
    const user_id = req.user.user_id;

    if (!attachment_id) {
      return res.status(400).json({
        success: false,
        message: "attachment_id is required",
      });
    }

    // Find the attachment
    const attachment = await IssueAttachment.findByPk(attachment_id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      });
    }

    // Delete the file from local storage
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // Delete record from database
    await attachment.destroy();

    return res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
      deleted_attachment: {
        attachment_id,
        file_name: attachment.file_name,
        deleted_by: user_id,
      },
    });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting attachment",
      error: error.message,
    });
  }
};
module.exports = {
  uploadMultipleAttachments,
  deleteAttachments,
  getAttachmentsByIssueId,
  deleteAttachmentById,
};
