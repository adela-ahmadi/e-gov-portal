// src/middleware/uploadMiddleware.js
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

//  Setting up directory paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

//  Setting up file storage location
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/documents'))
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

//  Setting up file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xlsx/
  const ext = path.extname(file.originalname).toLowerCase()
  const mimetype = allowedTypes.test(file.mimetype)
  const extname = allowedTypes.test(ext)

  if (mimetype && extname) {
    cb(null, true)
  } else {
    cb(new Error('Only images, PDF, DOC, XLSX files are allowed'))
  }
}

//  Setting up uploader
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

export default upload
