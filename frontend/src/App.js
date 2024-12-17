import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(30); // Timer for each question

  useEffect(() => {
    let timerId;
    if (quizQuestions.length > 0 && !showResults) {
      timerId = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer === 1) {
            handleNextQuestion();
            return 30; // Reset timer for the next question
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerId); // Cleanup interval on component unmount or question change
  }, [quizQuestions, showResults, currentQuestionIndex]);

  const handleFileUpload = (e) => {
    setPdfFile(e.target.files[0]);
    setError(null);
  };

  const handleParsePDF = async () => {
    if (!pdfFile) {
      setError("Please upload a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData
      );
      if (response.data.questions && response.data.questions.length === 10) {
        setQuizQuestions(response.data.questions);
        setError(null);
        setTimer(30); // Reset timer for the first question
      } else {
        setError("Failed to fetch 10 random questions from the PDF.");
      }
    } catch (err) {
      console.error("Error parsing PDF:", err);
      setError("Error parsing PDF. Ensure the file has at least 10 questions.");
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: option,
    });
  };

  const handleNextQuestion = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const userAnswer = selectedAnswers[currentQuestionIndex];

    if (userAnswer === currentQuestion.answer) {
      setScore((prevScore) => prevScore + 1);
    }

    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setTimer(30); // Reset timer for the next question
    } else {
      setShowResults(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setSelectedAnswers({});
    setQuizQuestions([]);
    setTimer(30);
  };

  return (
    <div className="App">
      <h1>PDF Quiz Generator</h1>

      {!quizQuestions.length && !showResults && (
        <div className="file-upload">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
          />
          <button onClick={handleParsePDF}>Upload and Parse PDF</button>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {quizQuestions.length > 0 && !showResults && (
        <div className="quiz">
          <h2>Question {currentQuestionIndex + 1}</h2>
          <p>{quizQuestions[currentQuestionIndex].question}</p>
          <div className="options">
            {quizQuestions[currentQuestionIndex].options.map(
              (option, index) => (
                <button
                  key={index}
                  className={`option ${
                    selectedAnswers[currentQuestionIndex] === option
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </button>
              )
            )}
          </div>
          <p>Time Remaining: {timer} seconds</p>
          <button
            onClick={handleNextQuestion}
            disabled={!selectedAnswers[currentQuestionIndex]}
          >
            Next
          </button>
        </div>
      )}

      {showResults && (
        <div className="results">
          <h2>Quiz Completed!</h2>
          <p>
            You scored {score} out of {quizQuestions.length}.
          </p>
          <ul>
            {quizQuestions.map((q, index) => (
              <li key={index}>
                <p>
                  <strong>Question {index + 1}:</strong> {q.question}
                </p>
                <p>
                  <strong>Your Answer:</strong>{" "}
                  {selectedAnswers[index] || "No answer selected"}
                </p>
                <p>
                  <strong>Correct Answer:</strong> {q.answer}
                </p>
              </li>
            ))}
          </ul>
          <button onClick={handleRestartQuiz}>Restart Quiz</button>
        </div>
      )}
    </div>
  );
}

export default App;
