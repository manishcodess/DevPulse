const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['user', 'ai', 'model', 'assistant', 'system'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: String, 
    default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
  },
  isDailyBrief: { 
    type: Boolean, 
    default: false 
  }
}, { _id: true, timestamps: { createdAt: true, updatedAt: false } });

const conversationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  title: { 
    type: String, 
    default: 'New Coaching Session', 
    trim: true,
    maxlength: 120 
  },
  messages: [messageSchema],
  pinned: { 
    type: Boolean, 
    default: false 
  },
  category: { 
    type: String, 
    enum: ['general', 'system_design', 'dsa', 'resume', 'mock_interview', 'career'], 
    default: 'general' 
  },
  tags: [{ 
    type: String, 
    trim: true 
  }],
  summary: { 
    type: String, 
    default: '',
    trim: true 
  }
}, { timestamps: true });

conversationSchema.index({ userId: 1, updatedAt: -1 });
conversationSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
