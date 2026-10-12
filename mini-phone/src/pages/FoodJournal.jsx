import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function FoodJournal() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [range, setRange] = useState('week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [progress, setProgress] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [savedFoods, setSavedFoods] = useState([])

  const loadDashboard = () => {
    fetch('http://localhost:5000/api/food-log/today', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setDashboard(data))
  }

  const loadProgress = (selectedRange, start, end) => {
    let url = `http://localhost:5000/api/food-log/progress?range=${selectedRange}`
    if (selectedRange === 'custom' && start && end) {
      url += `&start=${start}&end=${end}`
    }
    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setProgress(data))
  }

  const loadSavedFoods = (query) => {
    fetch(`http://localhost:5000/api/food-log/saved-foods?query=${encodeURIComponent(query)}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setSavedFoods(data))
  }

  useEffect(() => {
    fetch('http://localhost:5000/api/profile', { credentials: 'include' }).then((res) => {
      if (res.status === 404) {
        navigate('/food-setup')
      } else {
        loadDashboard()
        loadProgress('week')
        loadSavedFoods('')
      }
    })
  }, [])

  const handleRangeChange = (newRange) => {
    setRange(newRange)
    if (newRange !== 'custom') {
      loadProgress(newRange)
    }
  }

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      loadProgress('custom', customStart, customEnd)
    }
  }

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    loadSavedFoods(query)
  }

  const quickAdd = (food) => {
    fetch('http://localhost:5000/api/food-log/quick-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',body: JSON.stringify(food),
    }).then(() => loadDashboard())
  }
  const sendMessage = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }])
    setInput('')
    setLoading(true)

    fetch('http://localhost:5000/api/food-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: userMessage }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }])
        setLoading(false)
        loadDashboard()
      })
      .catch(() => {
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Something went wrong.' }])
        setLoading(false)
      })
  }

  if (!dashboard) {
    return <div className="phone-screen">Loading...</div>
  }

  return (
    <div className="phone-screen">
      <div className="top-bar">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
        <Link to="/" className="back-link">← Back</Link>
      </div>

      <h1>Food Journal</h1>

      <div className="goal-card">
        <strong>{dashboard.remaining} kcal remaining</strong>
        <span>{dashboard.totals.calories} / {dashboard.calorie_target} kcal eaten</span>
        <span>
          P: {dashboard.totals.protein_g}g · C: {dashboard.totals.carbs_g}g · F: {dashboard.totals.fat_g}g
        </span>
      </div>

      <input
        type="text"
        className="search-bar"
        placeholder="Search saved foods..."
        value={searchQuery}
        onChange={handleSearch}
      />

      <div className="goal-list">
        {savedFoods.map((food, i) => (
          <div className="saved-food-item" key={i}>
            <div>
              <strong>{food.food_description}</strong>
              <span className="app-status"> · {food.calories} kcal</span>
            </div>
            <button onClick={() => quickAdd(food)}>+ Add</button>
          </div>
        ))}
      </div>

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
          placeholder="e.g. had 2 idli and sambar for breakfast"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar-panel" onClick={(e) => e.stopPropagation()}>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
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
                  <span>Avg calories/day: {progress.avg_calories}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FoodJournal