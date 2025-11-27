const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    companyName: { type: String, required: true },
    department: { type: String },
    description: { type: String },
    location: { type: String },
    type: { type: String },
    workplace: { type: String },
    jobLevel: { type: String },
    maxResponseTime: { type: String },
    minSalary: { type: Number },
    maxSalary: { type: Number },
    status: { type: String, default: 'Active' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
