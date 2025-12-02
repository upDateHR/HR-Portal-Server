const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
require('dotenv').config();

// 
const multer = require("multer");
const path = require("path");
const fs = require("fs");

//
const Post = require("./models/Post");

const app = express();

app.use(cors());

//
// app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());

//
// static folder for uploaded files
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}
app.use("/uploads", express.static(uploadsPath));

//
// Multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

//
const upload = multer({ storage });

//
// Test route
app.get("/", (req, res) => {
  res.send("Backend Running ✔");
});

//
// GET ALL POSTS
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Unable to fetch posts" });
  }
});

//
// CREATE POST
app.post("/api/posts", upload.single("file"), async (req, res) => {
  try {
    const { userName, headline, text } = req.body;

    let fileUrl = "";
    let fileType = "";

    if (req.file) {
      fileUrl = "/uploads/" + req.file.filename;

      if (req.file.mimetype.startsWith("image/")) fileType = "image";
      else if (req.file.mimetype === "application/pdf") fileType = "pdf";
      else fileType = "other";
    }

    const newPost = await Post.create({
      userName,
      headline,
      text,
      fileUrl,
      fileType,
      // likes: []  // default se aa jayega schema se
    });

    res.status(201).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Unable to create post" });
  }
});

//
// COMMENT ON POST
app.post("/api/posts/:id/comments", async (req, res) => {
  try {
    const { userName, text } = req.body;
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ userName, text });
    await post.save();

    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Unable to add comment" });
  }
});

//
// ✅ LIKE / UNLIKE POST
app.post("/api/posts/:id/like", async (req, res) => {
  try {
    const { userName } = req.body;
    const { id } = req.params;

    if (!userName) {
      return res.status(400).json({ error: "userName required" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    const idx = post.likes.indexOf(userName);
    let liked;

    if (idx === -1) {
      // Like
      post.likes.push(userName);
      liked = true;
    } else {
      // Unlike
      post.likes.splice(idx, 1);
      liked = false;
    }

    await post.save();

    res.json({
      liked,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Unable to like post" });
  }
});

// --- EXISTING ROUTES ---
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const employerRoutes = require('./routes/employer');
app.use('/api/employer', employerRoutes);

const publicRoutes = require('./routes/public');
app.use('/api', publicRoutes);

const applicationsRoutes = require('./routes/applications');
app.use('/api', applicationsRoutes);

// --- 🟢 NEW CHATBOT AND STUDENT ROUTES ---
// 1. Chatbot Proxy Route (for /api/assistant/chat)
const assistantRoutes = require('./routes/assistant');
app.use('/api/assistant', assistantRoutes); 

const PORT = process.env.PORT || 5000;

async function start() {
    try {   
        const mongo = process.env.MONGO_URI; 
        await mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected Successfuly');
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start server', err);
        process.exit(1);
    }
}

start();