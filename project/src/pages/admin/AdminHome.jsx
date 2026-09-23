import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Award,
} from "lucide-react";
import { apiFetch } from "../../lib/api";

const AdminHome = () => {
  const [students, setStudents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(""); // added missing state
  const [selectedSemester, setSelectedSemester] = useState(""); // added missing state
  ////feedback);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await apiFetch("/api/students");
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data.data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await apiFetch("/api/feedbacks");
        if (!res.ok) throw new Error("Failed to fetch feedbacks");
        const data = await res.json();
        setFeedback(data.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchFeedbacks();
  }, []);

  const filteredAttendance = students.filter((record) => {
    if (selectedCourse && record.course !== selectedCourse) return false;
    if (selectedSemester && record.semester !== parseInt(selectedSemester))
      return false;
    return true;
  });

  const getAttendanceStats = () => {
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter(
      (r) => r.status === "Present"
    ).length;
    const absent = filteredAttendance.filter(
      (r) => r.status === "Absent"
    ).length;
    const late = filteredAttendance.filter((r) => r.status === "Late").length;
    const percentage =
      total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0;
    return { total, present, absent, late, percentage };
  };

  const status = getAttendanceStats();

  const stats = [
    {
      title: "Total Students",
      value: students.length,
      change: "+12%",
      icon: Users,
      color: "bg-blue-500",
      link: "/admin/students",
    },
    {
      title: "Today's Attendance",
      value: `${status.percentage}%`, // changed to show total instead of object
      change: "+5%",
      icon: Calendar,
      color: "bg-green-500",
      link: "/admin/attendance",
    },
    {
      title: "Active Placements",
      value: "45",
      change: "+8%",
      icon: Briefcase,
      color: "bg-purple-500",
      link: "/admin/placements",
    },
    {
      title: "Pending Feedback",
      value: feedback.length,
      change: "",
      icon: MessageSquare,
      color: "bg-orange-500",
      link: "/admin/feedback",
    },
  ];

  const recentActivities = [
    {
      action: "New student registered",
      details: "tamil - Computer Science",
      time: "2 hours ago",
      type: "success",
    },
    {
      action: "Placement drive scheduled",
      details: "TechCorp - Software Engineer positions",
      time: "4 hours ago",
      type: "info",
    },
    {
      action: "Attendance marked",
      details: "CS Department - Semester 6",
      time: "6 hours ago",
      type: "success",
    },
    {
      action: "Feedback received",
      details: "Course evaluation from 45 students",
      time: "1 day ago",
      type: "warning",
    },
  ];

  const [upcomingEvents, setupcomingEvents] = useState([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await apiFetch("/api/announcements");
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data = await response.json();
      // Assuming backend returns announcements as an array in data field
      setupcomingEvents(data.data || data);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="admin-home">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening at Progova today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
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
        {/* Recent Activities */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Activities</h2>
            <TrendingUp size={20} color="#6b7280" />
          </div>
          <div className="activities-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-indicator ${activity.type}`}></div>
                <div className="activity-content">
                  <h4>{activity.action}</h4>
                  <p>{activity.details}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Upcoming Events</h2>
            <Award size={20} color="#6b7280" />
          </div>
          <div className="events-list">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="event-item">
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
                  <p>{event.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Styles remain unchanged */}
      <style>{`
        .admin-home {
          max-width: 1200px;
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
          grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
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

        .bg-blue-500 {
          background-color: #3b82f6;
        }
        .bg-green-500 {
          background-color: #10b981;
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
          grid-template-columns: repeat(auto-fit, minmax(min(400px, 100%), 1fr));
          gap: 24px;
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
          justify-content: between;
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

        .activities-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
        }

        .activity-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 8px;
          flex-shrink: 0;
        }

        .activity-indicator.success {
          background-color: #10b981;
        }
        .activity-indicator.info {
          background-color: #3b82f6;
        }
        .activity-indicator.warning {
          background-color: #f59e0b;
        }

        .activity-content h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .activity-content p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .activity-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .event-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .event-item:hover {
          background-color: #f8fafc;
        }

        .event-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background-color: #3b82f6;
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
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .page-header h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminHome;
