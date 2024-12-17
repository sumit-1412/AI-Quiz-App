const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Google Gemini package
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
app.use(express.json());
app.use(cors());
app.use(fileUpload());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("Error: MONGO_URI is not defined in the .env file.");
  process.exit(1);
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  });

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: String, required: true },
});
const Question = mongoose.model("Question", QuestionSchema);

// Google Gemini setup
const apiKey = process.env.GOOGLE_API_KEY; // Load your API key from .env
if (!apiKey) {
  console.error("Error: GOOGLE_API_KEY is not defined in the .env file.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

// Generate Similar Questions with Options and Correct Answer
const generateSimilarQuestions = async (originalQuestion) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = `
      Generate a multiple-choice question related to the concept of binary search with four options and indicate the correct one. 
      The question should be similar in scope to this one: "${originalQuestion}".
      Provide 4 options labeled a), b), c), d), and explicitly indicate the correct one with "**Correct answer: <option>**" at the end.
    `;
    const result = await model.generateContent(prompt);
    console.log("Gemini API Raw Response:", JSON.stringify(result, null, 2));

    // Safely extract text from the response
    const response = result?.response || result;
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error(
        "No valid response text received from Google Gemini API."
      );
    }

    console.log("Generated Text:", text);

    // Split text into lines for parsing
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // Extract question (first line before options)
    const questionText = lines[0];

    // Extract options (lines starting with a), b), c), or d))
    const optionRegex = /^[a-d]\)/i;
    const options = lines.filter((line) => optionRegex.test(line));

    if (options.length !== 4) {
      throw new Error("Response does not contain exactly 4 options.");
    }

    // Extract correct answer from '**Correct answer: <option>**'
    const correctAnswerMatch = text.match(/\*\*Correct answer:\s*([a-d]\))/i);
    if (!correctAnswerMatch) {
      throw new Error("Correct answer not found in generated text.");
    }
    const correctOption = correctAnswerMatch[1]; // e.g., "b)"

    // Find the correct answer content
    const correctAnswer = options.find((opt) => opt.startsWith(correctOption));
    if (!correctAnswer) {
      throw new Error("Correct answer option not found among options.");
    }

    return {
      question: questionText,
      options: options.map((opt) => opt.replace(/^[a-d]\)\s*/, "").trim()), // Clean option labels
      answer: correctAnswer.replace(/^[a-d]\)\s*/, "").trim(), // Clean and set the correct answer
    };
  } catch (err) {
    console.error("Error generating similar question:", err.message);
    throw new Error("Failed to generate question.");
  }
};


// Routes
// PDF Upload and Parsing Endpoint
app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.pdf) {
    return res.status(400).send("No PDF file uploaded.");
  }

  const pdfData = req.files.pdf;
  if (pdfData.mimetype !== "application/pdf") {
    return res.status(400).send("Uploaded file is not a PDF.");
  }

  try {
    const data = await pdfParse(pdfData);
    const extractedQuestions = data.text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const questions = [];
    let currentQuestion = null;

    extractedQuestions.forEach((line) => {
      if (/^\d+\.\s/.test(line)) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = { question: line, options: [], answer: "" };
      } else if (/^[a-d]\)/i.test(line)) {
        currentQuestion?.options.push(line);
      } else if (/^Correct Answer:/i.test(line)) {
        currentQuestion.answer = line
          .replace(/^Correct Answer:\s*/i, "")
          .trim();
      }
    });

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    if (questions.length < 10) {
      return res
        .status(400)
        .send("The PDF must contain at least 10 questions.");
    }

    // Generate similar questions using Google Gemini
    const generatedQuestionsPromises = questions.slice(0, 3).map(async (q) => {
      try {
        const similarQuestion = await generateSimilarQuestions(q.question);
        return {
          question: similarQuestion.question,
          options: similarQuestion.options,
          answer: similarQuestion.answer,
        };
      } catch (err) {
        console.error("Error generating similar question:", err.message);
        return null; // Skip if there's an error
      }
    });

    const generatedQuestions = (
      await Promise.all(generatedQuestionsPromises)
    ).filter((q) => q);
    console.log(
      "Generated Similar Questions (at least 3):",
      generatedQuestions
    );

    // Combine original and generated questions
    const allQuestions = [...questions, ...generatedQuestions];

    // Randomly pick 10 questions
    const randomQuestions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    console.log("Final Selected Questions:", randomQuestions);

    res.json({ questions: randomQuestions });
  } catch (err) {
    console.error("Error parsing PDF:", err.message);
    res.status(500).send("Error parsing PDF");
  }
});

// Save Questions Endpoint
app.post("/save", async (req, res) => {
  const { question, options, answer } = req.body;
  if (!question || !options || !answer) {
    return res.status(400).send("Question, options, and answer are required.");
  }

  try {
    const newQuestion = new Question({ question, options, answer });
    await newQuestion.save();
    res.status(201).send("Question saved successfully");
  } catch (err) {
    console.error("Error saving question:", err.message);
    res.status(500).send("Error saving question");
  }
});

// Get Randomized Quiz Questions Endpoint
app.get("/questions", async (req, res) => {
  try {
    const questions = await Question.aggregate([{ $sample: { size: 10 } }]);
    questions.forEach((q) => {
      q.options = q.options.sort(() => Math.random() - 0.5); // Shuffle options
    });
    res.json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err.message);
    res.status(500).send("Error fetching questions");
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
