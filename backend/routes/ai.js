import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  classifyComplaint,
  generateATR,
  predictResolutionTime,
  chatbotResponse
} from '../services/aiService.js';

const router = express.Router();

// POST /api/ai/classify
// Classify complaint into category, department, severity
// Body: { text, imageDescription (optional) }
router.post('/classify', async (req, res) => {
  try {
    const { text, imageDescription } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Complaint text is required' });
    }

    const result = await classifyComplaint(text, imageDescription || '');
    res.json(result);
  } catch (error) {
    console.error('Classify endpoint error:', error.message);
    res.status(500).json({ error: 'Failed to classify complaint' });
  }
});

// POST /api/ai/atr
// Generate Action Taken Report
// Body: { complaint: { title, description, category, location }, resolutionNote }
router.post('/atr', protect, async (req, res) => {
  try {
    const { complaint, resolutionNote } = req.body;

    if (!complaint || !complaint.title || !resolutionNote) {
      return res.status(400).json({ error: 'Complaint and resolution note are required' });
    }

    const atr = await generateATR(complaint, resolutionNote);
    res.json({ atr });
  } catch (error) {
    console.error('ATR endpoint error:', error.message);
    res.status(500).json({ error: 'Failed to generate ATR' });
  }
});

// POST /api/ai/predict
// Predict resolution time for a complaint
// Body: { category, severity }
router.post('/predict', async (req, res) => {
  try {
    const { category, severity } = req.body;

    if (!category || !severity) {
      return res.status(400).json({ error: 'Category and severity are required' });
    }

    const prediction = await predictResolutionTime(category, severity);
    res.json(prediction);
  } catch (error) {
    console.error('Predict endpoint error:', error.message);
    res.status(500).json({ error: 'Failed to predict resolution time' });
  }
});

// POST /api/ai/chat
// Chatbot response endpoint
// Body: { message, complaints (optional array) }
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, complaints } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatbotResponse(message, complaints || []);
    res.json({ response });
  } catch (error) {
    console.error('Chat endpoint error:', error.message);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
