import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Goals() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [goals, setGoals] = useState([])
  const [title, setTitle] = useState('')
  const [timeframe, setTimeframe] = useState('weekly')
  const [targetCount, setTargetCount] = useState('')
  const [targetUnit, setTargetUnit] = useState('')

  const [range, setRange] = useState('week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [progress, setProgress] = useState(null)

  
  const loadGoals = () => {
    fetch('https://mp-6t23.onrender.com/api/goals', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setGoals(data))
  }

  const loadProgress = (selectedRange, start, end) => {
    let url = `https://mp-6t23.onrender.com/api/todos/progress?range=${selectedRange}`
    if (selectedRange === 'custom' && start && end) {
      url += `&start=${start}&end=${end}`
    }
    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setProgress(data))
  }

  const deleteGoal = (id) => {
  fetch(`https://mp-6t23.onrender.com/api/goals/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }).then(() => loadGoals())
  }
  


  useEffect(() => {
    loadGoals()
    loadProgress('week')
  }, [])

  const handleRangeChange = (newRange) => {
    setRange(newRange)
    if (newRange !== 'custom') loadProgress(newRange)
  }

  const applyCustomRange = () => {
    if (customStart && customEnd) loadProgress('custom', customStart, customEnd)
  }

  const handleAddGoal = (e) => {
    e.preventDefault()
    fetch('https://mp-6t23.onrender.com/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title,
        timeframe,
        target_count: Number(targetCount),
        target_unit: targetUnit,
      }),
    }).then(() => {
      setTitle('')
      setTargetCount('')
      setTargetUnit('')
      loadGoals()
    })
  }

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
      credentials: 'include',
      body: JSON.stringify({ message: userMessage }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }])
        setLoading(false)
        loadGoals()
      })
      .catch(() => {
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Something went wrong.' }])
        setLoading(false)
      })
  }

  return (
    <div className="phone-screen">
      <div className="top-bar">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
        <Link to="/" className="back-link">← Back</Link>
      </div>

      <h1>To-Do List</h1>
      <p className="page-subtitle">Check-in</p>

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

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar-panel" onClick={(e) => e.stopPropagation()}>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>

            <h2>Add Goal</h2>
            <form onSubmit={handleAddGoal} className="goal-form">
              <input
                type="text"
                placeholder="Goal title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input
                type="number"
                placeholder="Target count"
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Unit (times, mins, pages)"
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                required
              />
              <button type="submit">Add Goal</button>
            </form>

            <h2>Active Goals</h2>
            <div className="goal-list">
              {goals.map((goal) => {
                const percent = goal.target_count
                  ? Math.min(Math.round((goal.progress_count / goal.target_count) * 100), 100)
                  : 0
                return (
                  <div className="goal-card" key={goal._id}>
                    <strong>{goal.title}</strong>
                    <span>{goal.timeframe}</span>
                    <span>{goal.progress_count} / {goal.target_count} {goal.target_unit} ({percent}%)</span>
                    <button onClick={() => deleteGoal(goal._id)} className="delete-btn">🗑 Delete</button>
                  </div>
                )
              })}
            </div>

            <h2>Progress</h2>
            <div className="range-buttons">
              <button className={range === 'today' ? 'active' : ''} onClick={() => handleRangeChange('today')}>Today</button>
              <button className={range === 'yesterday' ? 'active' : ''} onClick={() => handleRangeChange('yesterday')}>Yesterday</button>
              <button className={range === 'week' ? 'active' : ''} onClick={() => handleRangeChange('week')}>Last week</button>
              <button className={range === 'custom' ? 'active' : ''} onClick={() => handleRangeChange('custom')}>Custom</button>
            </div>

            {range === 'custom' && (
              <div className="custom-range">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                <button onClick={applyCustomRange}>Apply</button>
              </div>
            )}

            {progress && (
              <div className="progress-stats">
                <div className="goal-card">
                  <span>🔥 Streak: {progress.streak} days</span>
                </div>
                <div className="goal-card">
                  <span>Days logged: {progress.days_logged}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Goals