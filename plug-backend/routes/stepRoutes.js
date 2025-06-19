const express = require('express');
const router = express.Router();
const stepController = require('../controller/stepController');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store files in 'uploads' folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
    }
});
// Middleware to check if user is admin

const isAdmin = async (req, res, next) => {
    const { email } = req.query;
    if (email === process.env.ADMIN_EMAIL) { // Replace with your admin email check
        next();
    } else {
        return res.status(403).json({ message: 'Unauthorized access' });
    }
};



// Public routes
router.get('/', stepController.getAllSteps);

// Admin routes
router.post('/', isAdmin, upload.single('image'), stepController.createStep);
router.put('/:id', isAdmin, upload.single('image'), stepController.updateStep);
router.delete('/:id', isAdmin, stepController.deleteStep);

module.exports = router;