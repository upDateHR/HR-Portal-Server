const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// Public jobs listing for candidates
router.get('/jobs/public', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 }).limit(200);
        res.json({ jobs });
    } catch (err) {
        console.error('Failed to fetch public jobs', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// (no public job detail route here)

module.exports = router;
