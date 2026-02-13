import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [question, setQuestion] = useState("Explain the difference between List and Tuple in Python.")
  const [answer, setAnswer] = useState("")
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState("Python")
  const [isListening, setIsListening] = useState(false)
  const [resumeFile, setResumeFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- New State: கடைசியாக எதை வச்சு கேள்வி கேட்டோம்? ---
  const [questionSource, setQuestionSource] = useState("topic"); // Default 'topic'

  // --- Functions ---
  const handleResumeFileChange = (event) => setResumeFile(event.target.files[0]);

  // 1. Resume Question
  const handleGenerateResumeQuestion = async () => {
    if (!resumeFile) return alert("Please select a resume file first!");

    setQuestionSource("resume"); // State-ஐ Resume என மாற்றுகிறோம்
    setLoading(true); setFeedback(""); setAnswer("");

    const formData = new FormData();
    formData.append("file", resumeFile);
    try {
      const response = await axios.post("http://127.0.0.1:8000/upload_resume", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setQuestion(response.data.question);
    } catch (error) { alert("Error generating question."); } finally { setLoading(false); }
  };

  // 2. Topic Question
  const handleGenerateTopicQuestion = async () => {
    setQuestionSource("topic"); // State-ஐ Topic என மாற்றுகிறோம்
    setLoading(true); setFeedback(""); setAnswer("");

    try {
      const response = await axios.post("http://127.0.0.1:8000/generate_question", { topic: topic });
      setQuestion(response.data.question);
    } catch (error) { alert("Error getting new question!"); } finally { setLoading(false); }
  };

  // 3. Smart Next Button Logic
  const handleSmartNextQuestion = () => {
    if (questionSource === "resume") {
      handleGenerateResumeQuestion();
    } else {
      handleGenerateTopicQuestion();
    }
  };

  const handleSubmit = async () => {
    if (!answer) return alert("Please type an answer!");
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/analyze_answer", { question: question, user_answer: answer });
      setFeedback(response.data.ai_feedback);
    } catch (error) { alert("Error analyzing!"); } finally { setLoading(false); }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Use Chrome!");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => setAnswer(prev => prev + " " + event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const fetchHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    try {
      const response = await axios.get("http://127.0.0.1:8000/history");
      setHistory(response.data); setShowHistory(true);
    } catch (error) { alert("Backend error!"); }
  };

  return (
    <div className="container">
      <h1>AI Interviewer Pro 🚀</h1>

      {/* --- Top Grid Section --- */}
      <div className="dashboard-grid">

        {/* Left: Resume Section */}
        <div className="card control-group">
          <h3 style={{ marginTop: 0 }}>📄 Resume Based</h3>
          <p>Upload your resume (PDF) to get tailored questions.</p>
          <div className="input-row">
            <input type="file" accept=".pdf" onChange={handleResumeFileChange} />
          </div>
          <button
            className="btn-secondary"
            onClick={handleGenerateResumeQuestion}
            disabled={loading}
          >
            {loading ? "Analyzing PDF..." : "Generate Resume Question 🎯"}
          </button>
        </div>

        {/* Right: Topic Section */}
        <div className="card control-group">
          <h3 style={{ marginTop: 0 }}>💻 Topic Based</h3>
          <p>Choose a specific tech stack to practice.</p>
          <div className="input-row">
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="Python">Python</option>
              <option value="React JS">React JS</option>
              <option value="Django">Django</option>
              <option value="SQL">SQL</option>
              <option value="HR">HR Round</option>
            </select>
          </div>
          <button
            className="btn-secondary"
            onClick={handleGenerateTopicQuestion}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Topic Question 🎲"}
          </button>
        </div>

      </div>

      {/* --- Question Display --- */}
      <div className="card question-card" style={{ marginTop: '50px' }}>

        {/* Header Row: Question Label + Smart Next Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, color: "var(--primary-color)", fontSize: '1.8rem' }}>
            Question:
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '12px' }}>
              ({questionSource === 'resume' ? 'From Resume' : 'From Topic'})
            </span>
          </h2>

          <button
            className="btn-next-q"
            onClick={handleSmartNextQuestion}
            disabled={loading}
          >
            {loading ? "Loading..." : "Next Question ⏭️"}
          </button>
        </div>

        <p style={{ fontSize: "1.45rem", lineHeight: "1.7", fontWeight: '500' }}>{question}</p>
      </div>

      {/* --- Answer Area --- */}
      <div style={{ marginTop: '30px' }}>
        <div style={{ marginBottom: "15px", textAlign: 'right' }}>
          <button
            onClick={startListening}
            className={isListening ? "btn-danger" : "btn-dark"}
            style={{ borderRadius: '50px', padding: '10px 25px' }}
          >
            {isListening ? "🛑 Stop Listening" : "🎤 Speak Answer"}
          </button>
        </div>

        <textarea
          rows="6"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type or speak your professional answer here..."
        />

        <div style={{ marginTop: '35px' }}>
          <button className="btn-primary btn-medium" onClick={handleSubmit} disabled={loading}>
            {loading ? "Analyzing Your Response..." : "Submit Answer 🚀"}
          </button>
        </div>
      </div>

      {/* --- Feedback --- */}
      {feedback && (
        <div className="card feedback-card" style={{ marginTop: '40px' }}>
          <h2 style={{ margin: 0, color: "var(--primary-color)", marginBottom: '20px' }}>AI Feedback:</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.8", fontSize: "1.15rem" }}>{feedback}</p>
        </div>
      )}

      {/* --- History --- */}
      <div style={{ marginTop: "50px", marginBottom: "60px" }}>
        <button className="btn-dark btn-medium" onClick={fetchHistory}>
          {showHistory ? "Hide History ⬆️" : "Show Interview History ⬇️"}
        </button>

        {showHistory && (
          <div style={{ marginTop: "25px", maxHeight: "450px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", background: "rgba(30,30,30,0.5)", backdropFilter: 'blur(10px)' }}>
            {history.map((item) => (
              <div key={item.id} style={{ padding: "25px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ color: 'var(--accent-teal)', fontWeight: '600' }}><strong>Q:</strong> {item.question}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '10px 0' }}><strong>Your Answer:</strong> {item.user_answer}</p>
                <p style={{ color: 'var(--primary-color)', fontSize: '0.95rem' }}><strong>AI Feedback:</strong> {item.ai_feedback?.substring(0, 120)}...</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default App