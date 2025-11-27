const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// re-use auth middleware exported from auth.js
const authModule = require('./auth');
const authMiddleware = authModule.authMiddleware;

// Create a new job posting
router.post('/jobs/create', authMiddleware, async (req, res) => {
    try {
        // only allow employers to create jobs
        if (!req.user || req.user.role !== 'employer') return res.status(403).json({ message: 'Forbidden' });

        const {
            title,
            companyName,
            department,
            description,
            location,
            type,
            workplace,
            jobLevel,
            maxResponseTime,
            minSalary,
            maxSalary,
        } = req.body;

        if (!title || !companyName) return res.status(400).json({ message: 'Missing required fields' });

        const job = new Job({
            title,
            companyName,
            department,
            description,
            location,
            type,
            workplace,
            jobLevel,
            maxResponseTime,
            minSalary,
            maxSalary,
            postedBy: req.user._id,
        });

        await job.save();
        res.json({ job });
    } catch (err) {
        console.error('Failed to create job', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Dashboard summary
router.get('/dashboard/summary', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'employer') return res.status(403).json({ message: 'Forbidden' });

        // fetch recent job postings for this employer
        const postings = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 }).limit(5);

        // attach applicants count for each posting
        const postingsWithCounts = await Promise.all(postings.map(async (p) => {
            const count = await Application.countDocuments({ job: p._id }).catch(() => 0);
            return { ...p.toObject(), applicantsCount: count };
        }));

        // basic metrics
        const totalJobs = await Job.countDocuments({ postedBy: req.user._id });
        const activeJobs = await Job.countDocuments({ postedBy: req.user._id, status: 'Active' }).catch(() => 0);

        const metrics = [
            { title: 'Total Jobs', value: totalJobs },
            { title: 'Recent Posts', value: postings.length },
            { title: 'Active Jobs', value: activeJobs },
        ];

        // applicants list not implemented — return postings with applicantsCount for dashboard
        res.json({ metrics, postings: postingsWithCounts, applicants: [] });
    } catch (err) {
        console.error('Failed to build dashboard summary', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get jobs for the currently authenticated employer
router.get('/jobs', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'employer') return res.status(403).json({ message: 'Forbidden' });
        const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
        // attach applicants count for each job
        const jobsWithCounts = await Promise.all(jobs.map(async (j) => {
            const count = await Application.countDocuments({ job: j._id }).catch(() => 0);
            return { ...j.toObject(), applicantsCount: count };
        }));
        res.json({ jobs: jobsWithCounts });
    } catch (err) {
        console.error('Failed to fetch jobs', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get job by id (public for now but restrict if needed)
router.get('/jobs/:id', authMiddleware, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('postedBy', 'name email company');
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json({ job });
    } catch (err) {
        console.error('Failed to fetch job', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
