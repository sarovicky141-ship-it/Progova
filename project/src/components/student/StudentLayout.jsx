import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Home, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  MessageSquare, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  GraduationCap
} from 'lucide-react'

const StudentLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/student', label: 'Dashboard', icon: Home, exact: true },
    { path: '/student/attendance', label: 'Attendance', icon: Calendar },
    { path: '/student/placements', label: 'Placements', icon: Briefcase },
    { path: '/student/progress', label: 'Progress', icon: TrendingUp },
    { path: '/student/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/student/notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="student-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-content">
          <div className="mobile-logo">
            <GraduationCap size={24} color="#3b82f6" />
            <span>Progova Student</span>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <GraduationCap size={32} color="#3b82f6" />
            <div>
              <h2>Progova</h2>
              <p>Student Portal</p>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="user-info">
            <h3>{user?.name}</h3>
            <p>{user?.course} - Sem {user?.semester}</p>
            <span className="roll-number">{user?.rollNumber}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive && (item.exact ? location.pathname === item.path : true) ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="main-content">
        {children}
      </div>

      <style jsx>{`
        .student-layout {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .mobile-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          color: #1f2937;
        }

        .mobile-menu-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #374151;
        }

        .sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          left: 0;
          top: 0;
          z-index: 999;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .sidebar-open {
          transform: translateX(0);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 998;
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sidebar-logo h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .sidebar-logo p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .sidebar-user {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 18px;
        }

        .user-info h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .user-info p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 4px 0;
        }

        .roll-number {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 0;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          color: #6b7280;
          text-decoration: none;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .nav-link:hover {
          background-color: #f3f4f6;
          color: #10b981;
        }

        .nav-link.active {
          background-color: #ecfdf5;
          color: #10b981;
          border-right: 3px solid #10b981;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .main-content {
          flex: 1;
          padding: 24px;
          margin-left: 0;
          overflow-x: auto;
        }

        @media (min-width: 1024px) {
          .mobile-header {
            display: none;
          }

          .sidebar {
            position: static;
            transform: none;
            height: auto;
          }

          .sidebar-overlay {
            display: none;
          }

          .main-content {
            margin-left: 0;
          }
        }

        @media (max-width: 1023px) {
          .mobile-header {
            display: block;
          }

          .main-content {
            padding-top: 80px;
          }
        }
      `}</style>
    </div>
  )
}

export default StudentLayout