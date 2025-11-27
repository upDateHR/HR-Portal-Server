const express = require("express");
const router = express.Router();
require("dotenv").config();
const axios = require("axios");

router.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("ENV TEST:", process.env.OPENROUTER_API_KEY);


  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a short, fast HR assistant. ALWAYS respond in 1–3 short sentences maximum. " +
              "Keep answers crisp, easy, and to the point. After every reply, add this line: " +
              "'If you want, I can explain this in detail.' Only give long answers when user says: 'Explain in detail'."
          },
          { role: "user", content: message }
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error("OpenRouter Error:", error.response?.data || error.message);
    res.status(500).json({ message: "AI request failed." });
  }
});

module.exports = router;
