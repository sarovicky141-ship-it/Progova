import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Lock, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()
  const { theme, toggleTheme } = useTheme()

  if (user) return <Navigate to={`/${user.role}`} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="login-container">
      <section className="login-visual">
        <div className="login-visual-brand"><GraduationCap size={26} /><span>Progova</span></div>
        <div className="login-visual-copy"><p className="eyebrow">Student management, made clear</p><h1>Keep every learner moving forward.</h1><p>One calm workspace for attendance, placements, progress, and meaningful connections.</p></div>
        <div className="login-visual-footer">Student Management &amp; Placement System</div>
      </section>
      <main className="login-panel">
        <button className="login-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
        <div className="login-form-container">
          <div className="login-form-heading"><span className="login-mobile-brand"><GraduationCap size={22} /> Progova</span><h2>Welcome back</h2><p>Sign in to continue to your workspace.</p></div>
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="notification notification-error">{error}</div>}
            <div className="form-group"><label className="form-label" htmlFor="email"><User size={16} /> Email</label><input id="email" type="email" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
            <div className="form-group"><label className="form-label" htmlFor="password"><Lock size={16} /> Password</label><div className="password-field"><input id="password" type={showPassword ? 'text' : 'password'} className="form-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
        </div>
        <footer className="login-footer"><div className="footer-links"><Link to="/about" className="footer-link">About</Link><Link to="/contact" className="footer-link">Contact</Link></div><p>&copy; 2024 Progova. All rights reserved.</p></footer>
      </main>
    </div>
  )
}

export default Login
