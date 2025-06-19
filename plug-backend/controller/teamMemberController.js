const TeamMember = require('../models/teamMember');

// Get all team members
exports.getAllTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamMember.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error fetching team members', details: error.message });
  }
};

// Get a single team member by ID
exports.getTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    console.error('Error fetching team member:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error fetching team member', details: error.message });
  }
};

// Create a new team member (admin only)
exports.createTeamMember = async (req, res) => {
  try {
    const { name, role, bio } = req.body;
    const imageUrl = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename.replace(/\\/g, '/')}` 
      : null;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const teamMember = await TeamMember.create({
      name,
      role,
      image: imageUrl,
      bio
    });

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: teamMember
    });
  } catch (error) {
    console.error('Error creating team member:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error creating team member', details: error.message });
  }
};

// Update a team member (admin only)
exports.updateTeamMember = async (req, res) => {
  try {
    const { name, role, bio } = req.body;
    const imageUrl = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename.replace(/\\/g, '/')}` 
      : req.body.image; // Retain existing image if not updated

    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    teamMember.name = name || teamMember.name;
    teamMember.role = role || teamMember.role;
    teamMember.image = imageUrl || teamMember.image;
    teamMember.bio = bio || teamMember.bio;

    await teamMember.save();

    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: teamMember
    });
  } catch (error) {
    console.error('Error updating team member:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error updating team member', details: error.message });
  }
};

// Delete a team member (admin only)
exports.deleteTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    await teamMember.deleteOne();

    res.json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team member:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error deleting team member', details: error.message });
  }
};