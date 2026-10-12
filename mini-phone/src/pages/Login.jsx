import { useState } from 'react'

function Login({ onLoginSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    })
      .then((res) => {
        if (res.ok) {
          onLoginSuccess()
        } else {
          setError('Incorrect password')
        }
      })
      .catch(() => setError('Something went wrong'))
  }

  return (
    <div className="phone-screen login-screen">
      <h1>My Mini Phone</h1>
      <form onSubmit={handleSubmit} className="goal-form">
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button type="submit">Unlock</button>
      </form>
      {error && <p className="login-error">{error}</p>}
    </div>
  )
}

export default Login