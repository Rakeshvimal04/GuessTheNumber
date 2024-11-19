import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [targetNumber, setTargetNumber] = useState("");
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [gameState, setGameState] = useState("start");
  const [bestScore, setBestScore] = useState(null);
  const [allScores, setAllScores] = useState([]);

  // Initialize IndexedDB
  useEffect(() => {
    const request = indexedDB.open("GuessingGameDB", 1);
    request.onsuccess = () => {
      console.log("Database opened successfully");
    };
    request.onerror = () => {
      console.error("Error opening database:", request.error);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("scores")) {
        db.createObjectStore("scores", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = fetchAllScores;
  }, []);

  // Generate a random 4-digit number with no repeated digits
  const generateNumber = () => {
    const digits = [];
    while (digits.length < 4) {
      const digit = Math.floor(Math.random() * 10);
      if (!digits.includes(digit)) digits.push(digit);
    }
    console.log(digits);
    return digits.join("");
  };

  // Start a new game
  const startGame = () => {
    setTargetNumber(generateNumber());
    setGameState("playing");
    setFeedback([]);
    setAttempts(0);
  };

  // Check the user's guess
  const handleGuess = () => {
    if (guess.length !== 4 || new Set(guess).size !== 4) {
      alert("Enter a valid 4-digit number with no duplicate digits.");
      return;
    }

    const feedbackArray = [];
    for (let i = 0; i < 4; i++) {
      if (guess[i] === targetNumber[i]) {
        feedbackArray.push("+");
      } else if (targetNumber.includes(guess[i])) {
        feedbackArray.push("-");
      }
    }

    setFeedback([...feedback, { guess, feedbackArray }]);
    setAttempts(attempts + 1);

    if (guess === targetNumber) {
      saveScore(attempts + 1);
      setGameState("finished");
    }

    setGuess("");
  };

  // Save the score in IndexedDB
  const saveScore = (numAttempts) => {
    const dbRequest = indexedDB.open("GuessingGameDB", 1);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction("scores", "readwrite");
      const store = transaction.objectStore("scores");
      store.add({
        name,
        attempts: numAttempts,
        timestamp: new Date().toISOString(),
      });
      transaction.oncomplete = fetchAllScores;
    };
  };

  // Fetch the best score
  const fetchBestScore = () => {
    const dbRequest = indexedDB.open("GuessingGameDB", 1);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction("scores", "readonly");
      const store = transaction.objectStore("scores");
      const request = store.getAll();

      request.onsuccess = () => {
        const scores = request.result;
        if (scores.length > 0) {
          scores.sort((a, b) => a.attempts - b.attempts); // Sort by attempts
          setBestScore(scores[0]);
        }
      };
    };
  };

  // Fetch all scores
  const fetchAllScores = () => {
    const dbRequest = indexedDB.open("GuessingGameDB", 1);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction("scores", "readonly");
      const store = transaction.objectStore("scores");
      const request = store.getAll();

      request.onsuccess = () => {
        const scores = request.result;
        setAllScores(scores);
        fetchBestScore(); // Update best score
      };
    };
  };

  return (
    <div className="container">
      <h1>Guessing Number Game</h1>

      {gameState === "start" && (
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={startGame} disabled={!name}>
            Start Game
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div>
          <p>Hello, {name}! Guess the 4-digit number.</p>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
          <button onClick={handleGuess}>Submit Guess</button>
          <div className="feedback">
            <h3>Feedback:</h3>
            <ul>
              {feedback.map((item, index) => (
                <li key={index}>
                  Guess: {item.guess} | Feedback: {item.feedbackArray.join(" ")}
                </li>
              ))}
            </ul>
          </div>
          <p>Attempts: {attempts}</p>
        </div>
      )}

      {gameState === "finished" && (
        <div className="finished">
          <h2>Congratulations, {name}! You guessed it in {attempts} attempts.</h2>
          <button onClick={startGame}>Play Again</button>
        </div>
      )}

      {bestScore && (
        <div className="best-score">
          <h3>Best Score:</h3>
          <p>
            Name: {bestScore.name} | Attempts: {bestScore.attempts}
          </p>
        </div>
      )}

      <div className="all-scores">
        <h3>All Players:</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Attempts</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {allScores.map((score) => (
              <tr key={score.id}>
                <td>{score.id}</td>
                <td>{score.name}</td>
                <td>{score.attempts}</td>
                <td>{new Date(score.timestamp).toLocaleDateString('en-US')}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
