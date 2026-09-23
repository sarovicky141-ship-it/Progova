import React, { useEffect, useState } from 'react'
import { Calendar, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { apiFetch } from '../../lib/api'

const StudentAttendance = () => {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentAttendance = async () => {
      if (!user?.studentId) {
        setAttendanceData([])
        setLoading(false)
        return
      }

      try {
        const response = await apiFetch(`/api/attendance/student/${user.studentId}`)
        if (!response.ok) throw new Error('Failed to fetch attendance')
        const data = await response.json()
        setAttendanceData(data.data || [])
      } catch (error) {
        console.error(error)
        setAttendanceData([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudentAttendance()
  }, [user])

  const attendanceSummary = attendanceData.reduce((summary, record) => {
    if (record.status === 'Present' || record.status === 'Late') summary.present += 1
    if (record.status === 'Absent') summary.absent += 1
    summary.total += 1
    return summary
  }, { present: 0, absent: 0, total: 0 })

  const overallPercentage = attendanceSummary.total > 0
    ? ((attendanceSummary.present / attendanceSummary.total) * 100).toFixed(1)
    : 0

  const thisMonthData = attendanceData.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear
  })

  const monthlyPresent = thisMonthData.filter((r) => r.status === 'Present' || r.status === 'Late').length
  const monthlyTotal = thisMonthData.length
  const monthlyPercentage = monthlyTotal > 0 ? ((monthlyPresent / monthlyTotal) * 100).toFixed(1) : 0

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle size={16} color="#10b981" />
      case 'Absent':
        return <XCircle size={16} color="#ef4444" />
      case 'Late':
        return <Clock size={16} color="#f59e0b" />
      default:
        return null
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="student-attendance">
      <div className="page-header">
        <h1>My Attendance</h1>
        <p>Track your attendance record and performance</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading attendance...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card overall">
              <div className="stat-icon">
                <TrendingUp size={32} color="white" />
              </div>
              <div className="stat-content">
                <h3>{overallPercentage}%</h3>
                <p>Overall Attendance</p>
                <span className="stat-detail">{attendanceSummary.present}/{attendanceSummary.total} classes</span>
              </div>
            </div>
            <div className="stat-card monthly">
              <div className="stat-icon">
                <Calendar size={32} color="white" />
              </div>
              <div className="stat-content">
                <h3>{monthlyPercentage}%</h3>
                <p>This Month</p>
                <span className="stat-detail">{monthlyPresent}/{monthlyTotal} classes</span>
              </div>
            </div>
          </div>

          <div className="records-section">
            <div className="records-header">
              <h2>Attendance Records</h2>
              <div className="date-filters">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="form-select"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="form-select"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                </select>
              </div>
            </div>

            <div className="records-table-container">
              <table className="table records-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check-in Time</th>
                  </tr>
                </thead>
                <tbody>
                  {thisMonthData
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((record, index) => (
                      <tr key={index}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>
                          <div className="status-cell">
                            {getStatusIcon(record.status)}
                            <span className={`status-badge status-${record.status.toLowerCase()}`}>
                              {record.status}
                            </span>
                          </div>
                        </td>
                        <td>{record.checkInTime || '-'}</td>
                      </tr>
                    ))}
                  {thisMonthData.length === 0 && (
                    <tr>
                      <td colSpan="3">No attendance records for this month.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}


      {/* Attendance Guidelines */}
      <div className="guidelines-section">
        <h2>Attendance Guidelines</h2>
        <div className="guidelines-grid">
          <div className="guideline-card excellent">
            <div className="guideline-icon">
              <CheckCircle size={24} />
            </div>
            <div className="guideline-content">
              <h3>Excellent (90%+)</h3>
              <p>Outstanding attendance record. Keep up the great work!</p>
            </div>
          </div>
          <div className="guideline-card good">
            <div className="guideline-icon">
              <TrendingUp size={24} />
            </div>
            <div className="guideline-content">
              <h3>Good (75-89%)</h3>
              <p>Good attendance. Try to improve to reach excellence.</p>
            </div>
          </div>
          <div className="guideline-card warning">
            <div className="guideline-icon">
              <XCircle size={24} />
            </div>
            <div className="guideline-content">
              <h3>Below Requirement (&lt;75%)</h3>
              <p>Attendance below requirement. Please improve to avoid issues.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .student-attendance {
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
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 32px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .stat-card.overall {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .stat-card.monthly {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .stat-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content h3 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-content p {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .stat-detail {
          font-size: 14px;
          opacity: 0.8;
        }

        .subjects-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .subjects-section h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .subject-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .subject-card:hover {
          background-color: #f8fafc;
        }

        .subject-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .subject-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .percentage {
          font-weight: 700;
          font-size: 18px;
        }

        .percentage.excellent { color: #10b981; }
        .percentage.good { color: #3b82f6; }
        .percentage.warning { color: #ef4444; }

        .attendance-progress {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow-x: auto;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .attendance-count {
          font-size: 14px;
          color: #6b7280;
          text-align: right;
        }

        .records-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .records-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .records-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
        }

        .date-filters {
          display: flex;
          gap: 12px;
        }

        .date-filters select {
          min-width: 120px;
        }

        .records-table-container {
          overflow-x: auto;
        }

        .records-table {
          width: 100%;
          margin: 0;
        }

        .status-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-late {
          background-color: #fef3c7;
          color: #92400e;
        }

        .guidelines-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .guidelines-section h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .guidelines-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .guideline-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .guideline-card.excellent {
          background-color: #ecfdf5;
          border-color: #10b981;
        }

        .guideline-card.good {
          background-color: #eff6ff;
          border-color: #3b82f6;
        }

        .guideline-card.warning {
          background-color: #fef2f2;
          border-color: #ef4444;
        }

        .guideline-icon {
          flex-shrink: 0;
        }

        .guideline-card.excellent .guideline-icon {
          color: #10b981;
        }

        .guideline-card.good .guideline-icon {
          color: #3b82f6;
        }

        .guideline-card.warning .guideline-icon {
          color: #ef4444;
        }

        .guideline-content h3 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .guideline-content p {
          font-size: 14px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .records-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .date-filters {
            justify-content: space-between;
          }

          .subjects-grid,
          .guidelines-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default StudentAttendance