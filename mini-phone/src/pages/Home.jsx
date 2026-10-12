import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Home() {

  const miniApps = [
    { name: 'To-Do List', icon: '✅', status: 'active', path: '/todo' },
    { name: 'Food Journal', icon: '🍽️', status: 'active', path: '/food' },
    { name: 'Instagram', icon: '📸', status: 'active', path: '/instagram' },
  ]


  return (
    <div className="phone-screen">
      <header className="phone-header">
        <h1>My Mini Phone</h1>
      </header>

      <main className="app-grid">
        {miniApps.map((app) =>
          app.path ? (
            <Link to={app.path} className="app-tile" key={app.name}>
              <span className="app-icon">{app.icon}</span>
              <span className="app-name">{app.name}</span>
              <span className="app-status">{app.status}</span>
            </Link>
          ) : (
            <div className="app-tile" key={app.name}>
              <span className="app-icon">{app.icon}</span>
              <span className="app-name">{app.name}</span>
              <span className="app-status">{app.status}</span>
            </div>
          )
        )}
      </main>
    </div>
  )
}

export default Home