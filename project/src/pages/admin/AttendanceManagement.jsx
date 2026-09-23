import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { apiFetch } from "../../lib/api";

const AttendanceManagement = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendanceForDate(selectedDate);
  }, [selectedDate]);

  const fetchStudents = async () => {
    try {
      const response = await apiFetch("/api/students");
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data.data || []);
    } catch (error) {
      alert(error.message);
    }
  };

  const fetchAttendanceForDate = async (date) => {
    try {
      const response = await apiFetch(`/api/attendance?date=${date}`);
      if (!response.ok) throw new Error("Failed to fetch attendance");
      const data = await response.json();
      setAttendanceRecords(data.data || []);
    } catch (error) {
      console.error(error);
      setAttendanceRecords([]);
    }
  };

  const courses = [
    "Computer Science",
    "Electronics",
    "Mechanical",
    "Civil",
    "Chemical",
  ];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const mergedAttendance = students.map((student) => {
    const attendanceEntry = attendanceRecords.find(
      (record) => record.studentId === student.id
    );

    return {
      ...student,
      status: attendanceEntry ? attendanceEntry.status : "Not Marked",
      checkInTime: attendanceEntry?.checkInTime || "",
    };
  });

  const filteredAttendance = mergedAttendance.filter((record) => {
    if (selectedCourse && record.course !== selectedCourse) return false;
    if (selectedSemester && record.semester !== parseInt(selectedSemester))
      return false;
    return true;
  });

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      const response = await apiFetch(`/api/attendance/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update attendance");
      }

      const updatedRecord = await response.json();
      setAttendanceRecords((prev) => {
        const existingIndex = prev.findIndex(
          (record) => record.studentId === studentId
        );

        if (existingIndex >= 0) {
          const revised = [...prev];
          revised[existingIndex] = updatedRecord.data;
          return revised;
        }

        return [...prev, updatedRecord.data];
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const getAttendanceStats = () => {
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter(
      (r) => r.status === "Present"
    ).length;
    const absent = filteredAttendance.filter(
      (r) => r.status === "Absent"
    ).length;
    const late = filteredAttendance.filter((r) => r.status === "Late").length;
    const notMarked = filteredAttendance.filter(
      (r) => r.status === "Not Marked"
    ).length;
    const markedTotal = present + absent + late;
    const percentage =
      markedTotal > 0 ? (((present + late) / markedTotal) * 100).toFixed(1) : 0;

    return { total, present, absent, late, notMarked, percentage };
  };

  const stats = getAttendanceStats();

  const exportAttendance = () => {
    const csvContent = [
      [
        "Date",
        "Student ID",
        "Name",
        "Course",
        "Semester",
        "Status",
        "Check-in Time",
      ],
      ...filteredAttendance.map((record) => [
        selectedDate,
        record.id,
        record.name,
        record.course,
        record.semester,
        record.status,
        record.checkInTime || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="attendance-management">
      <div className="page-header">
        <h1>Attendance Management</h1>
        <p>Track and manage student attendance records</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon present">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.present}</h3>
            <p>Present</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon absent">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.absent}</h3>
            <p>Absent</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon percentage">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.percentage || 0}%</h3>
            <p>Attendance Rate</p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="attendance-controls">
        <div className="filters">
          <div className="filter-group">
            <label>Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="filter-group">
            <label>Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="form-select"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="form-select"
            >
              <option value="">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={exportAttendance}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Attendance Table */}
      <div className="attendance-table-container">
        <table className="table attendance-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Status</th>
              <th>Check-in Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.name}</td>
                <td>{record.course}</td>
                <td>{record.semester}</td>
                <td>
                  <span
                    className={`status-badge status-${record.status.toLowerCase()}`}
                  >
                    {record.status}
                  </span>
                </td>
                <td>{record.checkInTime || "-"}</td>
                <td>
                  <div className="status-buttons">
                    <button
                      className={`status-btn present-btn ${
                        record.status === "Present" ? "active" : ""
                      }`}
                      onClick={() => handleStatusChange(record.id, "Present")}
                      title="Mark Present"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      className={`status-btn absent-btn ${
                        record.status === "Absent" ? "active" : ""
                      }`}
                      onClick={() => handleStatusChange(record.id, "Absent")}
                      title="Mark Absent"
                    >
                      <XCircle size={16} />
                    </button>
                    <button
                      className={`status-btn late-btn ${
                        record.status === "Late" ? "active" : ""
                      }`}
                      onClick={() => handleStatusChange(record.id, "Late")}
                      title="Mark Late"
                    >
                      <Calendar size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .attendance-management {
          max-width: 1200px;
          width: 100%;
          max-width: 100%;
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
        .stat-icon.present {
          background-color: #10b981;
        }
        .stat-icon.absent {
          background-color: #ef4444;
        }
        .stat-icon.percentage {
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

        .attendance-controls {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 24px;
          gap: 20px;
        }

        .filters {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .filter-group input,
        .filter-group select {
          min-width: 150px;
        }

        .attendance-table-container {
          background: white;
          border-radius: 12px;
          overflow-x: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .attendance-table {
          width: 100%;
          margin: 0;
        }

        .status-buttons {
          display: flex;
          gap: 4px;
        }

        .status-btn {
          padding: 6px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0.6;
        }

        .status-btn.active {
          opacity: 1;
        }

        .present-btn {
          background-color: #dcfce7;
          color: #166534;
        }

        .present-btn:hover,
        .present-btn.active {
          background-color: #10b981;
          color: white;
        }

        .absent-btn {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .absent-btn:hover,
        .absent-btn.active {
          background-color: #ef4444;
          color: white;
        }

        .late-btn {
          background-color: #fef3c7;
          color: #92400e;
        }

        .late-btn:hover,
        .late-btn.active {
          background-color: #f59e0b;
          color: white;
        }

        .status-late {
          background-color: #fef3c7;
          color: #92400e;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
          }

          .attendance-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .filters {
            justify-content: space-between;
          }

          .filter-group input,
          .filter-group select {
            min-width: auto;
          }

          .attendance-table-container {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default AttendanceManagement;
