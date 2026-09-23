import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Calendar,
  Briefcase,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "../../lib/api";

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]); // Start with empty array

  useEffect(() => {
    // Fetch messages from backend API on mount
    const fetchMessages = async () => {
      try {
        const response = await apiFetch("/api/messages");
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data = await response.json();
        setNotifications(data.data || []); // Set the messages from API response
      } catch (error) {
        alert(error.message);
      }
    };

    fetchMessages();
  }, []);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRead, setFilterRead] = useState("all");

  const filteredNotifications = notifications.filter((notification) => {
    if (filterCategory !== "all" && notification.category !== filterCategory)
      return false;
    if (filterRead === "unread" && notification.read) return false;
    if (filterRead === "read" && !notification.read) return false;
    return true;
  });

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(
      notifications.filter((notification) => notification.id !== id)
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "placement":
        return <Briefcase size={20} />;
      case "academic":
      case "exam":
        return <BookOpen size={20} />;
      case "course":
        return <Calendar size={20} />;
      case "general":
      case "event":
        return <Bell size={20} />;
      default:
        return <Mail size={20} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "#ef4444";
      case "high":
        return "#f59e0b";
      case "normal":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle size={16} />;
      case "high":
        return <Clock size={16} />;
      case "normal":
        return <CheckCircle size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const getStats = () => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const urgent = notifications.filter(
      (n) => n.priority === "urgent" && !n.read
    ).length;
    const today = notifications.filter((n) => n.date === "2024-02-14").length;

    return { total, unread, urgent, today };
  };

  const stats = getStats();

  const categories = [
    "all",
    "Academic",
    "Placement",
    "Course",
    "Exam",
    "General",
    "Career",
    "Event",
    "Finance",
  ];

  return (
    <div className="student-notifications">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Stay updated with important announcements and messages</p>
      </div>

      {/* Notification Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <Bell size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Notifications</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon unread">
            <Mail size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.unread}</h3>
            <p>Unread</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon urgent">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.urgent}</h3>
            <p>Urgent</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon today">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.today}</h3>
            <p>Today</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="notification-controls">
        <div className="filters">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="form-select"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="form-select"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
        {stats.unread > 0 && (
          <button className="btn btn-secondary" onClick={markAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-card ${
              !notification.read ? "unread" : ""
            }`}
          >
            <div className="notification-header">
              <div className="notification-icon">
                <div className={`icon-wrapper ${notification.type}`}>
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              <div className="notification-meta">
                <div className="notification-title-row">
                  <h3>{notification.title}</h3>
                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
                <div className="notification-details">
                  <span className="category-badge">
                    {notification.category}
                  </span>
                  <div
                    className="priority-badge"
                    style={{ color: getPriorityColor(notification.priority) }}
                  >
                    {getPriorityIcon(notification.priority)}
                    <span>{notification.priority}</span>
                  </div>
                  <span className="notification-time">
                    {notification.date} • {notification.time}
                  </span>
                </div>
              </div>
            </div>

            <div className="notification-content">
              <p>{notification.message}</p>
            </div>

            <div className="notification-actions">
              {!notification.read && (
                <button
                  className="action-btn read-btn"
                  onClick={() => markAsRead(notification.id)}
                  title="Mark as Read"
                >
                  <CheckCircle size={16} />
                  Mark as Read
                </button>
              )}
              {/* <button
                className="action-btn delete-btn"
                onClick={() => deleteNotification(notification.id)}
                title="Delete Notification"
              >
                Delete
              </button> */}
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="no-notifications">
          <Bell size={48} color="#9ca3af" />
          <h3>No notifications found</h3>
          <p>Try adjusting your filters or check back later for new updates.</p>
        </div>
      )}

      <style>{`
        .student-notifications {
          max-width: 1000px;
          width: 100%;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .page-header p {
          color: #6b7280;
          font-size: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-icon.total {
          background-color: #3b82f6;
        }
        .stat-icon.unread {
          background-color: #10b981;
        }
        .stat-icon.urgent {
          background-color: #ef4444;
        }
        .stat-icon.today {
          background-color: #8b5cf6;
        }

        .stat-content h3 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .stat-content p {
          color: #6b7280;
          font-size: 14px;
        }

        .notification-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .filters {
          display: flex;
          gap: 12px;
        }

        .filters select {
          min-width: 150px;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .notification-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .notification-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .notification-card.unread {
          border-left: 4px solid #10b981;
          background: linear-gradient(90deg, #f0fdf4 0%, white 10%);
        }

        .notification-header {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .notification-icon .icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .icon-wrapper.placement {
          background-color: #3b82f6;
        }
        .icon-wrapper.academic,
        .icon-wrapper.exam {
          background-color: #ef4444;
        }
        .icon-wrapper.course {
          background-color: #8b5cf6;
        }
        .icon-wrapper.general,
        .icon-wrapper.event {
          background-color: #10b981;
        }
        .icon-wrapper.counseling,
        .icon-wrapper.finance {
          background-color: #f59e0b;
        }

        .notification-meta {
          flex: 1;
        }

        .notification-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .notification-title-row h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .unread-indicator {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .notification-details {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .category-badge {
          padding: 2px 8px;
          background-color: #f3f4f6;
          color: #374151;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .priority-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .notification-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .notification-content p {
          color: #374151;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .notification-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .read-btn {
          background-color: #10b981;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .read-btn:hover {
          background-color: #059669;
        }

        .delete-btn {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .delete-btn:hover {
          background-color: #ef4444;
          color: white;
        }

        .no-notifications {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .no-notifications h3 {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin: 16px 0 8px 0;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
          }

          .notification-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .filters {
            justify-content: space-between;
          }

          .notification-header {
            flex-direction: column;
            gap: 12px;
          }

          .notification-details {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .notification-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentNotifications;
