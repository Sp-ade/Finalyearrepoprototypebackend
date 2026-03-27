const express = require('express');
const projectController = require('../controllers/projectController');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET all projects
router.get('/', projectController.getAllProjects);

// GET all tags
router.get('/tags', projectController.getAllTags);

// GET single project by ID
router.get('/:id', projectController.getProjectById);

// POST create new project
router.post('/', projectController.createProject);

// PUT update project
router.put('/:id', projectController.updateProject);

// DELETE project
router.delete('/:id', projectController.deleteProject);

module.exports = router;

