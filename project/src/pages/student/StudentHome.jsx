import { React, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Bell,
  Award,
  Clock,
  Target,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const StudentHome = () => {
  const { user } = useAuth();

  const quickStats = [
    {
      title: "Attendance Rate",
      value: "89%",
      change: "+5%",
      icon: Calendar,
      color: "bg-green-500",
      link: "/student/attendance",
    },
    {
      title: "Active Placements",
      value: "12",
      change: "+3",
      icon: Briefcase,
      color: "bg-blue-500",
      link: "/student/placements",
    },
    {
      title: "Course Progress",
      value: "78%",
      change: "+12%",
      icon: TrendingUp,
      color: "bg-purple-500",
      link: "/student/progress",
    },
    {
      title: "New Notifications",
      value: "5",
      change: "+2",
      icon: Bell,
      color: "bg-orange-500",
      link: "/student/notifications",
    },
  ];

  const recentNotifications = [
    {
      title: "Placement Drive - TechCorp",
      message: "New placement opportunity available. Apply by Friday.",
      time: "2 hours ago",
      type: "placement",
      priority: "high",
    },
    {
      title: "Assignment Due",
      message: "Database Systems assignment due tomorrow.",
      time: "4 hours ago",
      type: "academic",
      priority: "urgent",
    },
    {
      title: "Course Update",
      message: "New materials uploaded for Web Development course.",
      time: "1 day ago",
      type: "course",
      priority: "normal",
    },
    {
      title: "Exam Schedule",
      message: "Mid-semester examination schedule released.",
      time: "2 days ago",
      type: "exam",
      priority: "high",
    },
  ];

  const [upcomingEvents, setupcomingEvents] = useState([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/announcements");
      console.log(response);

      if (!response.ok) {
        console.log(response);

        throw new Error("Failed to fetch announcements");
      }
      const data = await response.json();

      // Assuming backend returns announcements as an array in data field
      setupcomingEvents(data.data || data);
    } catch (error) {
      alert(error.message);
    }
  };

  const currentCourses = [
    { name: "Advanced Database Systems", progress: 85, credits: 4 },
    { name: "Web Development", progress: 72, credits: 3 },
    { name: "Data Structures", progress: 91, credits: 4 },
    { name: "Computer Networks", progress: 68, credits: 3 },
  ];

  return (
    <div className="student-home">
      <div className="welcome-header">
        <div className="welcome-content">
          <h1>Welcome back, {user?.name}!</h1>
          <p>Here's your academic overview and latest updates.</p>
          <div className="student-details">
            <span className="detail-item">
              <strong>Course:</strong> {user?.course}
            </span>
            <span className="detail-item">
              <strong>Semester:</strong> {user?.semester}
            </span>
            <span className="detail-item">
              <strong>Roll No:</strong> {user?.rollNumber}
            </span>
          </div>
        </div>
        <div className="welcome-graphic">
          <Award size={64} color="#10b981" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {quickStats.map((stat, index) => (
          <Link key={index} to={stat.link} className="stat-card">
            <div className="stat-icon">
              <div className={`icon-wrapper ${stat.color}`}>
                <stat.icon size={24} color="white" />
              </div>
            </div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
              <span
                className={`stat-change ${
                  stat.change.startsWith("+") ? "positive" : "negative"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Current Courses */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Current Courses</h2>
            <Target size={20} color="#6b7280" />
          </div>
          <div className="courses-list">
            {currentCourses.map((course, index) => (
              <div key={index} className="course-item">
                <div className="course-info">
                  <h4>{course.name}</h4>
                  <span className="credits">{course.credits} Credits</span>
                </div>
                <div className="course-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{course.progress}%</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/student/progress" className="view-all-link">
            View Detailed Progress →
          </Link>
        </div>

        {/* Recent Notifications */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Notifications</h2>
            <Bell size={20} color="#6b7280" />
          </div>
          <div className="notifications-list">
            {recentNotifications.slice(0, 4).map((notification, index) => (
              <div key={index} className="notification-item">
                <div
                  className={`notification-indicator ${notification.priority}`}
                ></div>
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="notification-time">{notification.time}</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/student/notifications" className="view-all-link">
            View All Notifications →
          </Link>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="dashboard-card">
        <div className="card-header">
          <h2>Upcoming Events</h2>
          <Clock size={20} color="#6b7280" />
        </div>
        <div className="events-grid">
          {upcomingEvents.map((event, index) => (
            <div key={index} className="event-card">
              <div className="event-date">
                <span className="date">{new Date(event.date).getDate()}</span>
                <span className="month">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </span>
              </div>
              <div className="event-content">
                <h4>{event.title}</h4>
                <p>{event.time}</p>
                <span className={`event-type type-${event.type}`}>
                  {event.type}
                </span>
                <span className="event-description">{event.content}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .student-home {
          max-width: 1200px;
          width: 1000px;
          margin: 0 auto;
        }

        .welcome-header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 16px;
          padding: 32px;
          color: white;
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-content h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .welcome-content p {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 16px;
        }

        .student-details {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .detail-item {
          font-size: 14px;
          opacity: 0.9;
        }

        .detail-item strong {
          font-weight: 600;
        }

        .welcome-graphic {
          opacity: 0.7;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-icon .icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg-green-500 {
          background-color: #10b981;
        }
        .bg-blue-500 {
          background-color: #3b82f6;
        }
        .bg-purple-500 {
          background-color: #8b5cf6;
        }
        .bg-orange-500 {
          background-color: #f59e0b;
        }

        .stat-content h3 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .stat-content p {
          color: #6b7280;
          margin-bottom: 4px;
        }

        .stat-change {
          font-size: 14px;
          font-weight: 600;
        }

        .stat-change.positive {
          color: #10b981;
        }

        .stat-change.negative {
          color: #ef4444;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .dashboard-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .card-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .courses-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .course-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .course-item:hover {
          background-color: #f8fafc;
        }

        .course-info h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .credits {
          font-size: 12px;
          color: #6b7280;
        }

        .course-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 120px;
        }

        .progress-bar {
          width: 80px;
          height: 6px;
          background-color: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background-color: #10b981;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 600;
          color: #10b981;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .notification-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .notification-item:hover {
          background-color: #f8fafc;
        }

        .notification-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 8px;
          flex-shrink: 0;
        }

        .notification-indicator.high {
          background-color: #f59e0b;
        }
        .notification-indicator.urgent {
          background-color: #ef4444;
        }
        .notification-indicator.normal {
          background-color: #10b981;
        }

        .notification-content h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .notification-content p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .notification-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .view-all-link {
          color: #10b981;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .event-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .event-card:hover {
          background-color: #f8fafc;
        }

        .event-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background-color: #10b981;
          color: white;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .event-date .date {
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
        }

        .event-date .month {
          font-size: 12px;
          text-transform: uppercase;
        }

        .event-content h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .event-content p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .event-type {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .type-exam {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .type-counseling {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .type-workshop {
          background-color: #fef3c7;
          color: #92400e;
        }

        @media (max-width: 768px) {
          .welcome-header {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }

          .welcome-content h1 {
            font-size: 28px;
          }

          .student-details {
            justify-content: center;
            gap: 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .events-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentHome;
