# Quiz Generator with Google Gemini and MongoDB

This project implements an automated quiz generator and manager. It allows users to upload a PDF containing quiz questions, and then it uses Google Gemini's API to generate similar questions based on the uploaded content. The system stores and retrieves quiz questions from MongoDB, enabling the creation of randomized quizzes.

## Features
- Upload a PDF file containing quiz questions.
- Extract questions, options, and answers from the PDF.
- Use Google Gemini API to generate similar questions.
- Store and retrieve quiz questions in a MongoDB database.
- Randomize quiz questions and their options for quizzes.

## Technologies Used
- **Node.js**: Backend JavaScript runtime environment.
- **Express.js**: Web framework for building RESTful APIs.
- **MongoDB**: NoSQL database to store questions.
- **Google Gemini API**: For generating similar multiple-choice questions.
- **pdf-parse**: Library for extracting text from PDF files.
- **express-fileupload**: Middleware for handling file uploads in Express.
- **CORS**: Middleware for enabling cross-origin requests.

## Requirements

- Node.js (>=v16.x.x)
- MongoDB instance (local or Atlas)
- A Google Gemini API key

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/quiz-generator.git
cd quiz-generator
```

### 2. Install Dependencies
Install all the required dependencies by running the following command:

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory of the project and add the following variables:

```plaintext
MONGO_URI=your_mongodb_connection_uri
GOOGLE_API_KEY=your_google_gemini_api_key
```

Replace `your_mongodb_connection_uri` with your MongoDB connection URI (you can use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) if using a cloud database).

Replace `your_google_gemini_api_key` with your [Google Gemini API](https://cloud.google.com/blog/topics/ai-machine-learning/introducing-google-gemini) key.

### 4. Run the Application

After setting up your environment variables, run the server using:

```bash
npm start
```

This will start the application on `http://localhost:5000`.

### 5. API Endpoints

#### **POST /upload**
- **Description**: Upload a PDF containing quiz questions. The system will extract the questions, options, and answers from the PDF and generate similar questions using the Google Gemini API.
- **Request**:
  - **Form Data**: A file upload (`pdf`).
- **Response**:
  - A JSON object containing the original and generated quiz questions.

#### **POST /save**
- **Description**: Save a question with its options and the correct answer to the MongoDB database.
- **Request**:
  - **JSON Body**:
    ```json
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct answer"
    }
    ```
- **Response**:
  - Confirmation message upon successful save.

#### **GET /questions**
- **Description**: Retrieve 10 random questions from the database with shuffled options.
- **Response**:
  - A JSON object containing an array of 10 random questions, each with shuffled options.

## Example Request

### Upload PDF and Generate Questions

1. **URL**: `http://localhost:5000/upload`
2. **Method**: POST
3. **Form Data**: Upload a PDF file.

**Response**:
```json
{
  "questions": [
    {
      "question": "What is the time complexity of a binary search algorithm in the worst-case scenario?",
      "options": ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
      "answer": "O(log n)"
    },
    {
      "question": "What is the minimum number of comparisons required to find the number 17 in a sorted array of 15 elements using binary search?",
      "options": ["1", "3", "4", "5"],
      "answer": "3"
    }
    // More questions...
  ]
}
```

### Save Question to Database

1. **URL**: `http://localhost:5000/save`
2. **Method**: POST
3. **JSON Body**:
```json
{
  "question": "What is the minimum number of comparisons required to find the number 17 in a sorted array of 15 elements using binary search?",
  "options": ["1", "3", "4", "5"],
  "answer": "3"
}
```

**Response**:
```json
{
  "message": "Question saved successfully"
}
```

### Retrieve Random Quiz Questions

1. **URL**: `http://localhost:5000/questions`
2. **Method**: GET

**Response**:
```json
[
  {
    "question": "What is the time complexity of a binary search algorithm in the worst-case scenario?",
    "options": ["O(log n)", "O(n)", "O(1)", "O(n^2)"],
    "answer": "O(log n)"
  },
  // More questions...
]
```

## Troubleshooting

- **Issue with PDF Upload**: Ensure that the file is a valid PDF and contains quiz questions in the expected format.
- **Error Generating Questions**: If you encounter issues with generating questions using the Google Gemini API, ensure that your API key is valid and that the Google Gemini service is operational.

## Contributing

Contributions are welcome! If you encounter any bugs or have suggestions for improvement, feel free to create an issue or submit a pull request.

## License

This project is licensed under the MIT License.

---
