import { useState } from 'react'
import { Link } from 'react-router-dom'

function TodoChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }])
    setInput('')
    setLoading(true)

    fetch('https://mp-6t23.onrender.com/api/todo-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }])
        setLoading(false)
      })
      .catch(() => {
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Something went wrong.' }])
        setLoading(false)
      })
  }

  return (
    <div className="phone-screen">
      <Link to="/todo" className="back-link">← Goals</Link>
      <h1>Daily Check-in</h1>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="chat-bubble ai">...</div>}
      </div>

      <form onSubmit={sendMessage} className="chat-form">
        <input
          type="text"
          placeholder="e.g. I exercised and read 10 pages"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

export default TodoChat