// backend/routes/cache.js
const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../config/redis');

// GET cached value by key
router.get('/:key', async (req, res) => {
  try {
    const data = await getCache(req.params.key);
    if (data === null) return res.status(404).json({ error: 'Key not found' });
    res.json({ key: req.params.key, value: data });
  } catch (err) {
    console.error('Cache GET error:', err);
    res.status(500).json({ error: 'Cache error' });
  }
});

// POST to set cache (expects JSON body { value: <any> })
router.post('/:key', async (req, res) => {
  try {
    const ttl = req.body.ttl || 3600; // default 1h
    await setCache(req.params.key, req.body.value, ttl);
    res.json({ message: 'Cached', key: req.params.key, ttl });
  } catch (err) {
    console.error('Cache SET error:', err);
    res.status(500).json({ error: 'Cache error' });
  }
});

module.exports = router;
