import { useState } from "react";
import "./Chat.css";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      const botMessage = {
        sender: "bot",
        text: data.response,
        intent: data.intent,
        confidence: data.confidence,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Server error. Try again later." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="chat-container">
      <h2>Intent-Based Chatbot</h2>

      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
            {msg.sender === "bot" && msg.intent && (
              <small>
                Intent: <b>{msg.intent}</b> | Confidence:{" "}
                {(msg.confidence * 100).toFixed(1)}%
              </small>
            )}
          </div>
        ))}
        {loading && <p className="typing">Bot is typing...</p>}
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
