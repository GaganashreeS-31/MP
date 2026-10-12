import { useState } from 'react'
import { Link } from 'react-router-dom'

function InstagramGate() {
  const [answered, setAnswered] = useState(false)
  const [reason, setReason] = useState('')

  const reasons = [
    'I have something specific to check',
    "I'm bored",
    'Habit',
    'Other',
  ]

  return (
    <div className="phone-screen">
      <Link to="/" className="back-link">← Back</Link>
      <h1>Why Instagram?</h1>

      {!answered ? (
        <div className="goal-form">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => { setReason(r); setAnswered(true) }}
            >
              {r}
            </button>
          ))}
        </div>
      ) : (
        <div className="goal-card">
          <span>You said: {reason}</span>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="chat-form button"
            style={{ display: 'block', textAlign: 'center', marginTop: '12px', background: '#7fd88f', padding: '10px', borderRadius: '8px', color: '#111319', fontWeight: 600, textDecoration: 'none' }}
          >
            Open Instagram
          </a>
        </div>
      )}
    </div>
  )
}

export default InstagramGate