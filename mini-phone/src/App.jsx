import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Goals from './pages/Goals'
import FoodSetup from './pages/FoodSetup'
import FoodJournal from './pages/FoodJournal'
import Login from './pages/Login'
import './App.css'
import InstagramGate from './pages/InstagramGate'

function App() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/auth-check', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(data.authenticated)
        setAuthChecked(true)
      })
  }, [])

  if (!authChecked) {
    return <div className="phone-screen">Loading...</div>
  }

  if (!authenticated) {
    return <Login onLoginSuccess={() => setAuthenticated(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/todo" element={<Goals />} />
        <Route path="/food-setup" element={<FoodSetup />} />
        <Route path="/food" element={<FoodJournal />} />
        <Route path="/instagram" element={<InstagramGate />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App