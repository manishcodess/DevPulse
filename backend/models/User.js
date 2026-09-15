const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  githubUsername: { 
    type: String, 
    default: '',
    trim: true
  },
  leetcodeUsername: { 
    type: String, 
    default: '',
    trim: true
  },
  bio: {
    type: String,
    default: '',
    trim: true
  },
  resumeContext: {
    type: String,
    default: '',
    trim: true
  },
  targetRole: {
    type: String,
    default: '',
    trim: true
  },
  targetCompanies: [{
    type: String,
    trim: true
  }],
  preferredLanguage: {
    type: String,
    default: '',
    trim: true
  },
  devMemories: [{
    category: {
      type: String,
      enum: ['goal', 'weakness', 'strength', 'preference', 'tech_stack', 'general'],
      default: 'general'
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    source: {
      type: String,
      enum: ['manual', 'ai_extracted'],
      default: 'manual'
    },
    confidence: {
      type: Number,
      default: 1.0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
