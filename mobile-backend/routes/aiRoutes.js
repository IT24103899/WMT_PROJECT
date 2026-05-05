const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Proxy URL for the Python AI Engine (Uses Env Var on Render, localhost for Dev)
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'https://python-a-9.onrender.com/api/mobile';

// Helper for proxying requests
async function proxyRequest(endpoint, method, body = null) {
  try {
    console.log(`[AI Proxy] Routing ${method} to: ${PYTHON_AI_URL}${endpoint}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for AI

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${PYTHON_AI_URL}${endpoint}`, options);
    clearTimeout(timeoutId);
    
    const data = await response.json();
    console.log(`[AI Proxy] Received status ${response.status} from Python Engine`);
    return { status: response.status, data };
  } catch (error) {
    console.error(`[AI Proxy Error] ${endpoint}:`, error.message);
    return { status: 503, data: { error: 'AI Engine unreachable or timed out', details: error.message } };
  }
}

// 1. Health Check
router.get('/health', async (req, res) => {
  const result = await proxyRequest('/health', 'GET');
  res.status(result.status).json(result.data);
});

// 2. Recommend by Idea
router.post('/recommend/idea', protect, async (req, res) => {
  const result = await proxyRequest('/recommend/idea', 'POST', req.body);
  
  // Wrap direct array into the 'recommendations' object expected by the mobile app
  if (result.status === 200 && Array.isArray(result.data)) {
    return res.status(200).json({ recommendations: result.data });
  }
  
  res.status(result.status).json(result.data);
});

// 3. Log Velocity
router.post('/velocity/log', protect, async (req, res) => {
  const result = await proxyRequest('/velocity/log', 'POST', req.body);
  res.status(result.status).json(result.data);
});

// 4. Get Velocity Stats
router.get('/velocity/stats/:userId/:bookId', protect, async (req, res) => {
  const { userId, bookId } = req.params;
  const result = await proxyRequest(`/velocity/stats/${userId}/${bookId}`, 'GET');
  res.status(result.status).json(result.data);
});

module.exports = router;
