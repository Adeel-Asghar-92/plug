const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, 'Step number is required'],
    trim: true,
    maxlength: [10, 'Step number cannot exceed 10 characters']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  isReverse: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    trim: true
  },
  youtubeUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/, 'Please enter a valid YouTube URL'],
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Step', stepSchema);