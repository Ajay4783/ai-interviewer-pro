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

  // --- State to track question source (Resume vs Topic) ---
  const [questionSource, setQuestionSource] = useState("topic"); 

  // --- Backend URL ---
  const API_URL = "https://ai-interviewer-backend-brd5.onrender.com";

  // --- Functions ---
  const handleResumeFileChange = (event) => setResumeFile(event.target.files[0]);

  // 1. Resume Question
  const handleGenerateResumeQuestion = async () => {
    if (!resumeFile) return alert("Please select a resume file first!");

    setQuestionSource("resume");
    setLoading(true); setFeedback(""); setAnswer("");

    const formData = new FormData();
    formData.append("file", resumeFile);
    try {
      const response = await axios.post(`${API_URL}/upload_resume`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setQuestion(response.data.question);
    } catch (error) { 
      console.error(error);
      alert("Error generating question from resume."); 
    } finally { setLoading(false); }
  };

  // 2. Topic Question
  const handleGenerateTopicQuestion = async () => {
    setQuestionSource("topic");
    setLoading(true); setFeedback(""); setAnswer("");

    try {
      const response = await axios.post(`${API_URL}/generate_question`, { topic: topic });
      setQuestion(response.data.question);
    } catch (error) { 
      console.error(error);
      alert("Error getting new question!"); 
    } finally { setLoading(false); }
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
      const response = await axios.post(`${API_URL}/analyze_answer`, { question: question, user_answer: answer });
      setFeedback(response.data.ai_feedback);
    } catch (error) { 
      console.error(error);
      alert("Error analyzing answer!"); 
    } finally { setLoading(false); }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition is only supported in Chrome/Edge.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAnswer(prev => prev ? prev + " " + transcript : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const fetchHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    try {
      const response = await axios.get(`${API_URL}/history`);
      setHistory(response.data); 
      setShowHistory(true);
    } catch (error) { alert("Error fetching history!"); }
  };

  return (
    <div className="container">
      <h1>AI Interviewer Pro 🚀</h1>

      {/* --- Dashboard Grid Section --- */}
      <div className="dashboard-grid">

        {/* Left Card: Resume Section */}
        <div className="card control-group">
          <h3 style={{marginTop:0}}>📄 Resume Based</h3>
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

        {/* Right Card: Topic Section */}
        <div className="card control-group">
          <h3 style={{marginTop:0}}>💻 Topic Based</h3>
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

      {/* --- Question Display Section --- */}
      <div className="card question-card" style={{ marginTop: '30px' }}>
        
        {/* Header with Smart Next Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: "var(--primary-color)" }}>
            Question:
            <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal', marginLeft: '10px' }}>
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

        <p className="question-text" style={{fontSize: '1.4rem', fontWeight: '500'}}>{question}</p>
      </div>

      {/* --- Answer Area --- */}
      <div style={{ marginTop: '30px' }}>
        <div style={{ marginBottom: "15px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={startListening}
            className={isListening ? "btn-danger" : "btn-dark"}
            style={{ borderRadius: '50px', padding: '10px 20px', fontSize: '0.9rem' }}
          >
            {isListening ? "🛑 Stop Listening" : "🎤 Speak Answer"}
          </button>
        </div>

        <textarea
          rows="6"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type or speak your professional answer here..."
          style={{width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff'}}
        />

        <div style={{ marginTop: '20px' }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{width: '100%'}}>
            {loading ? "Analyzing..." : "Submit Answer 🚀"}
          </button>
        </div>
      </div>

      {/* --- Feedback Section --- */}
      {feedback && (
        <div className="card feedback-card" style={{ marginTop: '30px', borderLeft: '5px solid #64ffda' }}>
          <h2 style={{ color: "var(--primary-color)", marginBottom: '15px' }}>AI Feedback:</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{feedback}</p>
        </div>
      )}

      {/* --- History Section --- */}
      <div style={{ marginTop: "40px", marginBottom: "50px" }}>
        <button className="btn-dark" onClick={fetchHistory} style={{ width: "100%" }}>
          {showHistory ? "Hide History ⬆️" : "Show Interview History ⬇️"}
        </button>

        {showHistory && (
          <div className="history-container" style={{ marginTop: "20px", background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '20px' }}>
            {history.map((item) => (
              <div key={item.id} className="history-item" style={{ paddingBottom: "15px", borderBottom: "1px solid #444", marginBottom: "15px" }}>
                <p style={{ color: '#64ffda', fontWeight: 'bold' }}>Q: {item.question}</p>
                <p style={{ color: '#ccc', fontSize: '0.95rem' }}>You: {item.user_answer}</p>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: "5px", fontStyle: 'italic' }}>AI: {item.ai_feedback?.substring(0, 100)}...</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default App