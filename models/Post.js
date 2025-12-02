// models/Post.js

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  userName: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    headline: { type: String },
    text: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    comments: [commentSchema],

    // ⭐ Likes system: userName ki list
    likes: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
