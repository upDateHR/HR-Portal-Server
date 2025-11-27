const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const authModule = require('./auth');
const authMiddleware = authModule.authMiddleware;

// =======================================================
// Candidate applies
// =======================================================
router.post('/applications', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'candidate')
            return res.status(403).json({ message: 'Forbidden' });

        const { jobId, message } = req.body;

        const existing = await Application.findOne({
            candidate: req.user._id,
            job: jobId
        });

        if (existing) {
            return res.status(400).json({ message: 'Already applied' });
        }

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const app = new Application({
            job: job._id,
            candidate: req.user._id,
            candidateName: req.user.name,
            candidateEmail: req.user.email,
            message: message || ''
        });

        await app.save();
        return res.json({ success: true });
    } catch (err) {
        console.error("Failed to apply:", err);
        return res.status(500).json({ message: "Server error" });
    }
});


// =======================================================
// Candidate sees applications
// =======================================================
router.get('/applications', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'candidate')
      return res.status(403).json({ message: 'Forbidden' });

    const apps = await Application.find({ candidate: req.user._id })
      .populate('job', 'title companyName location type');

    res.json(apps);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error retrieving" });
  }
});

// =======================================================
// Employer sees applicants
// =======================================================
router.get('/applicants', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer')
      return res.status(403).json({ message: 'Forbidden' });

    const jobs = await Job.find({ postedBy: req.user._id }).select('_id title');
    const jobIds = jobs.map(j => j._id);

    const apps = await Application.find({
      job: { $in: jobIds }
    })
    .populate('candidate', 'name email')
    .populate('job', 'title');

    const result = apps.map(a => ({
      _id: a._id,
      name: a.candidate?.name,
      email: a.candidate?.email,
      jobId: a.job ? { _id: a.job._id, title: a.job.title } : null,
      status: a.status,
      createdAt: a.createdAt
    }));

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error retrieving applicants" });
  }
});

// =======================================================
// Employer shortlists or rejects (pending only)
// =======================================================
router.put('/applicants/status/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer')
      return res.status(403).json({ message: 'Forbidden' });

    const app = await Application.findById(req.params.id).populate('job');
    if (!app) return res.status(404).json({ message: 'Not found' });

    if (String(app.job.postedBy) !== String(req.user._id))
      return res.status(403).json({ message: 'Forbidden action' });

    if (app.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    app.status = req.body.status;
    await app.save();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating status" });
  }
});

// =======================================================
// Hiring Pipeline
// =======================================================
router.get('/hiring-pipeline', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer')
      return res.status(403).json({ message: 'Forbidden' });

    const jobs = await Job.find({ postedBy: req.user._id }).select('_id');
    const jobIds = jobs.map(j => j._id);

    const apps = await Application.find({
      job: { $in: jobIds },
      status: { $in: ["shortlisted", "interview_scheduled", "offer_extended", "hired"] }
    })
    .populate('candidate', 'name email')
    .populate('job', 'title');

    res.json(apps);

  } catch (err) {
    console.error("Pipeline error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =======================================================
// Employer progresses hiring stages
// =======================================================
router.put('/hiring-stage/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer')
      return res.status(403).json({ message: 'Forbidden' });

    const { status } = req.body;

    if (!["interview_scheduled", "offer_extended", "hired"].includes(status))
      return res.status(400).json({ message: "Invalid stage" });

    const app = await Application.findById(req.params.id).populate('job');

    if (String(app.job.postedBy) !== String(req.user._id))
      return res.status(403).json({ message: 'Not owner' });

    app.status = status;
    await app.save();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating stage" });
  }
});

router.get('/applications-per-month', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'employer')
      return res.status(403).json({ message: "Forbidden" });

    const jobs = await Job.find({ postedBy: req.user._id }).select('_id');
    const jobIds = jobs.map(j => j._id);

    const apps = await Application.find({ job: { $in: jobIds } });

    // Count per month
    const monthlyCounts = {};

    apps.forEach(app => {
      const month = new Date(app.createdAt).toLocaleString('en-US', { month: 'short' });
      if (!monthlyCounts[month]) monthlyCounts[month] = 0;
      monthlyCounts[month]++;
    });

    res.json(monthlyCounts);
  } catch (err) {
    console.error('Monthly stats error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/applications/check/:jobId', authMiddleware, async (req, res) => {
    try {
        const applied = await Application.findOne({
            candidate: req.user._id,
            job: req.params.jobId
        });

        return res.json({ applied: !!applied });
    } catch (err) {
        console.error('Check applied error', err);
        res.status(500).json({ applied: false });
    }
});

module.exports = router;
