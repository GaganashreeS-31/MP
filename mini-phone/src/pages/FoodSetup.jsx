import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function FoodSetup() {
  const navigate = useNavigate()
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('female')
  const [activityLevel, setActivityLevel] = useState('moderate')
  const [goal, setGoal] = useState('maintain')

  const handleSubmit = (e) => {
    e.preventDefault()

    fetch('http://localhost:5000/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',      body: JSON.stringify({
        weight_kg: Number(weight),
        height_cm: Number(height),
        age: Number(age),
        sex,
        activity_level: activityLevel,
        goal,
      }),
    }).then(() => {
      navigate('/food')
    })
  }

  return (
    <div className="phone-screen">
      <Link to="/" className="back-link">← Back</Link>
      <h1>Food Journal Setup</h1>

      <form onSubmit={handleSubmit} className="goal-form">
        <input
          type="number"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Height (cm)"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
        <select value={sex} onChange={(e) => setSex(e.target.value)}>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
        <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
          <option value="sedentary">Sedentary (little exercise)</option>
          <option value="light">Light (1-3 days/week)</option>
          <option value="moderate">Moderate (3-5 days/week)</option>
          <option value="active">Active (6-7 days/week)</option>
        </select>
        <select value={goal} onChange={(e) => setGoal(e.target.value)}>
          <option value="lose">Lose weight</option>
          <option value="maintain">Maintain weight</option>
          <option value="gain">Gain weight</option>
        </select>
        <button type="submit">Calculate & Continue</button>
      </form>
    </div>
  )
}

export default FoodSetup