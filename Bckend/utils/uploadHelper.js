const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// ===============================
// Multer Disk Storage (Temp File)
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir()); // OS temp folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `fyp-upload-${uniqueSuffix}${ext}`);
  }
});

// ===============================
// Multer Config (PDF/DOC/DOCX)
// ===============================
const upload = multer({
  storage,
  limits: {},
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
    }
  }
});

// ===============================
// Upload to Cloudinary (RAW PDFs)
// ===============================
const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
  folder,
  resource_type: 'raw',
  upload_preset: 'fyp_public_upload',
  type: 'upload',
  access_mode: 'public'
});


    // Delete temporary file
    try {
      await fs.unlink(filePath);
    } catch (delErr) {
      console.error('Temp file delete failed:', delErr);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id
    };

  } catch (error) {
    console.error('Cloudinary upload failed:', error);

    // Cleanup temp file on failure
    try {
      await fs.unlink(filePath);
    } catch (delErr) {
      console.error('Failed to delete temp file after upload error:', delErr);
    }

    throw error;
  }
};

// ===============================
// Delete File From Cloudinary
// ===============================
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'  // IMPORTANT for pdf/doc/docx
    });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary
};
