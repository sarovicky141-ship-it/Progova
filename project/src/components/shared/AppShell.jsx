import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, GraduationCap, LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import './AppShell.css'

const AppShell = ({ children, role, navItems }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentItem = navItems.find((item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path),
  )
  const activeIndex = Math.max(navItems.indexOf(currentItem), 0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`app-shell app-shell-${role}`}>
      <header className="mobile-header">
        <button className="icon-button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="brand-mark brand-mark-compact"><GraduationCap size={20} /><span>Progova</span></div>
      </header>

      <aside className={`app-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><GraduationCap size={23} /><span>Progova</span></div>
          <span className="brand-role">{role === 'admin' ? 'Admin workspace' : 'Student portal'}</span>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.charAt(0) || (role === 'admin' ? 'A' : 'S')}</div>
          <div className="user-info">
            <strong>{user?.name || (role === 'admin' ? 'Administrator' : 'Student')}</strong>
            <span>{role === 'admin' ? 'Administrator' : user?.course || 'Student'}</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-caption">Workspace</span>
          <span className="active-nav-indicator" style={{ transform: `translateY(${activeIndex * 46}px)` }} aria-hidden="true" />
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive && (!item.exact || location.pathname === item.path) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><LogOut size={18} /><span>Log out</span></button>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="shell-main">
        <div className="topbar">
          <div>
            <p className="eyebrow">{role === 'admin' ? 'Admin workspace' : 'Student portal'}</p>
            <h1>{currentItem?.label || 'Dashboard'}</h1>
          </div>
          <div className="topbar-actions">
            {role === 'student' && <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>}
            <button className={`theme-switch ${theme}`} onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              <span className="theme-switch-thumb">{theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}</span>
              <span className="theme-switch-track-icon">{theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}</span>
            </button>
            <div className="topbar-user"><div className="user-avatar small">{user?.name?.charAt(0) || 'U'}</div><span>{user?.name || 'Account'}</span></div>
          </div>
        </div>
        <div className="shell-content">{children}</div>
      </main>
    </div>
  )
}

export default AppShell