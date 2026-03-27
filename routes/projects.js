const express = require('express');
const projectController = require('../controllers/projectController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

// GET all projects (Public/Optional Auth)
router.get('/', optionalAuthenticate, projectController.getAllProjects);

// GET all tags (Public/Optional Auth)
router.get('/tags', optionalAuthenticate, projectController.getAllTags);

// GET single project by ID (Public/Optional Auth)
router.get('/:id', optionalAuthenticate, projectController.getProjectById);

// POST create new project (Mandatory Auth)
router.post('/', authenticate, projectController.createProject);

// PUT update project (Mandatory Auth)
router.put('/:id', authenticate, projectController.updateProject);

// DELETE project (Mandatory Auth)
router.delete('/:id', authenticate, projectController.deleteProject);

module.exports = router;

