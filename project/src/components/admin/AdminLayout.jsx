import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home,
  Users,
  Calendar,
  Briefcase,
  MessageSquare,
  Send,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: Home, exact: true },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/attendance", label: "Attendance", icon: Calendar },
    { path: "/admin/placements", label: "Placements", icon: Briefcase },
    { path: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    { path: "/admin/messages", label: "Messages", icon: Send },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-content">
          <div className="mobile-logo">
            <GraduationCap size={24} color="#3b82f6" />
            <span>Progova Admin</span>
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
      <div className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <GraduationCap size={32} color="#3b82f6" />
            <div>
              <h2>Progova</h2>
              <p>Admin Panel</p>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.charAt(0) || "A"}</div>
          <div className="user-info">
            <h3>{user?.name}</h3>
            <p>Administrator</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${
                  isActive &&
                  (item.exact ? location.pathname === item.path : true)
                    ? "active"
                    : ""
                }`
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
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="main-content">{children}</div>
    </div>
  );
};

export default AdminLayout;
