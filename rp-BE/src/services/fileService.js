const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../uploads');

// Ensure upload directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// Upload file
const uploadFile = async (file) => {
  await ensureUploadsDir();
  
  const fileExt = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);
  
  await fs.rename(file.path, filePath);
  
  return {
    url: `/uploads/${fileName}`,
    path: filePath,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  };
};

// Delete file
const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  uploadFile,
  deleteFile
};