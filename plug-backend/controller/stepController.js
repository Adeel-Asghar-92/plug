const Step = require('../models/step');

// Get all steps
exports.getAllSteps = async (req, res) => {
  try {
    const steps = await Step.find().sort({ number: 1 });
    res.json({
      success: true,
      data: steps
    });
  } catch (error) {
    console.error('Error fetching steps:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error fetching steps', details: error.message });
  }
};

// Create a new step (admin only)
exports.createStep = async (req, res) => {
  try {
    const { number, title, description, isReverse, youtubeUrl } = req.body;
    const imageUrl = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename.replace(/\\/g, '/')}` 
      : null;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const step = await Step.create({
      number,
      title,
      description,
      isReverse,
      image: imageUrl,
      youtubeUrl
    });

    res.status(201).json({
      success: true,
      message: 'Step created successfully',
      data: step
    });
  } catch (error) {
    console.error('Error creating step:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error creating step', details: error.message });
  }
};

// Update a step (admin only)
exports.updateStep = async (req, res) => {
  try {
    const { number, title, description, isReverse, youtubeUrl } = req.body;
    const imageUrl = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename.replace(/\\/g, '/')}` 
      : req.body.image;

    const step = await Step.findById(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    step.number = number || step.number;
    step.title = title || step.title;
    step.description = description || step.description;
    step.isReverse = isReverse !== undefined ? isReverse : step.isReverse;
    step.image = imageUrl || step.image;
    step.youtubeUrl = youtubeUrl !== undefined ? youtubeUrl : step.youtubeUrl;

    await step.save();

    res.json({
      success: true,
      message: 'Step updated successfully',
      data: step
    });
  } catch (error) {
    console.error('Error updating step:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error updating step', details: error.message });
  }
};

// Delete a step (admin only)
exports.deleteStep = async (req, res) => {
  try {
    const step = await Step.findById(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    await step.deleteOne();

    res.json({
      success: true,
      message: 'Step deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting step:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error deleting step', details: error.message });
  }
};