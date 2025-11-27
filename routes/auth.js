const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const jwtSecret = process.env.JWT_SECRET || 'change_this_secret';

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });
        if (!['candidate', 'employer'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already in use' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const user = new User({ name, email, password: hash, role });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// middleware: verify JWT and attach user
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try {
        const payload = jwt.verify(token, jwtSecret);
        const user = await User.findById(payload.id).select('-password');
        if (!user) return res.status(401).json({ message: 'Invalid token' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// GET current user
router.get('/me', authMiddleware, async (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
