import React, { useState } from 'react'
import { TrendingUp, BookOpen, Award, Target, Calendar, CheckCircle } from 'lucide-react'

const StudentProgress = () => {
  const [selectedSemester, setSelectedSemester] = useState(6)

  const semesterData = {
    1: {
      courses: [
        { name: 'Mathematics I', credits: 4, grade: 'A', points: 9.0, status: 'Completed' },
        { name: 'Physics I', credits: 4, grade: 'B+', points: 8.0, status: 'Completed' },
        { name: 'Programming Fundamentals', credits: 3, grade: 'A', points: 9.0, status: 'Completed' },
        { name: 'English Communication', credits: 2, grade: 'A-', points: 8.5, status: 'Completed' }
      ]
    },
    2: {
      courses: [
        { name: 'Mathematics II', credits: 4, grade: 'A-', points: 8.5, status: 'Completed' },
        { name: 'Physics II', credits: 4, grade: 'B', points: 7.0, status: 'Completed' },
        { name: 'Data Structures', credits: 4, grade: 'A', points: 9.0, status: 'Completed' },
        { name: 'Digital Logic', credits: 3, grade: 'B+', points: 8.0, status: 'Completed' }
      ]
    },
    6: {
      courses: [
        { name: 'Advanced Database Systems', credits: 4, grade: null, points: null, status: 'In Progress', progress: 85 },
        { name: 'Web Development', credits: 3, grade: null, points: null, status: 'In Progress', progress: 72 },
        { name: 'Data Structures & Algorithms', credits: 4, grade: null, points: null, status: 'In Progress', progress: 91 },
        { name: 'Computer Networks', credits: 3, grade: null, points: null, status: 'In Progress', progress: 68 }
      ]
    }
  }

  const achievements = [
    {
      title: 'Academic Excellence',
      description: 'Maintained GPA above 8.5 for 3 consecutive semesters',
      date: '2024-01-15',
      type: 'academic',
      icon: Award
    },
    {
      title: 'Programming Contest Winner',
      description: 'First place in inter-college programming competition',
      date: '2023-12-10',
      type: 'competition',
      icon: Target
    },
    {
      title: 'Perfect Attendance',
      description: '100% attendance for Database Systems course',
      date: '2024-02-01',
      type: 'attendance',
      icon: CheckCircle
    }
  ]

  const currentSemesterCourses = semesterData[selectedSemester]?.courses || []

  const calculateGPA = (courses) => {
    const completedCourses = courses.filter(course => course.grade !== null)
    if (completedCourses.length === 0) return 0

    const totalPoints = completedCourses.reduce((sum, course) => sum + (course.points * course.credits), 0)
    const totalCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0)
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0
  }

  const calculateOverallGPA = () => {
    let totalPoints = 0
    let totalCredits = 0

    Object.values(semesterData).forEach(semester => {
      semester.courses.forEach(course => {
        if (course.grade !== null) {
          totalPoints += course.points * course.credits
          totalCredits += course.credits
        }
      })
    })

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0
  }

  const getTotalCredits = () => {
    let completed = 0
    let total = 0

    Object.values(semesterData).forEach(semester => {
      semester.courses.forEach(course => {
        total += course.credits
        if (course.status === 'Completed') {
          completed += course.credits
        }
      })
    })

    return { completed, total }
  }

  const overallGPA = calculateOverallGPA()
  const semesterGPA = calculateGPA(currentSemesterCourses)
  const credits = getTotalCredits()

  const getGradeColor = (grade) => {
    if (!grade) return '#9ca3af'
    if (grade.startsWith('A')) return '#10b981'
    if (grade.startsWith('B')) return '#3b82f6'
    if (grade.startsWith('C')) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="student-progress">
      <div className="page-header">
        <h1>Academic Progress</h1>
        <p>Track your course progress, grades, and achievements</p>
      </div>

      {/* Progress Overview */}
      <div className="progress-overview">
        <div className="overview-card gpa-card">
          <div className="card-icon">
            <TrendingUp size={32} color="white" />
          </div>
          <div className="card-content">
            <h3>{overallGPA}</h3>
            <p>Overall GPA</p>
            <span className="gpa-scale">Out of 10.0</span>
          </div>
        </div>

        <div className="overview-card credits-card">
          <div className="card-icon">
            <BookOpen size={32} color="white" />
          </div>
          <div className="card-content">
            <h3>{credits.completed}/{credits.total}</h3>
            <p>Credits Completed</p>
            <div className="credits-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(credits.completed / credits.total) * 100}%` }}
                ></div>
              </div>
              <span>{Math.round((credits.completed / credits.total) * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="overview-card semester-card">
          <div className="card-icon">
            <Calendar size={32} color="white" />
          </div>
          <div className="card-content">
            <h3>Semester {selectedSemester}</h3>
            <p>Current Semester</p>
            <span className="semester-gpa">GPA: {semesterGPA || 'In Progress'}</span>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Course Progress */}
        <div className="progress-section">
          <div className="section-header">
            <h2>Course Progress</h2>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="form-select"
            >
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
              <option value={6}>Semester 6 (Current)</option>
            </select>
          </div>

          <div className="courses-list">
            {currentSemesterCourses.map((course, index) => (
              <div key={index} className="course-card">
                <div className="course-header">
                  <div className="course-info">
                    <h4>{course.name}</h4>
                    <span className="credits">{course.credits} Credits</span>
                  </div>
                  <div className="course-status">
                    {course.status === 'Completed' ? (
                      <div className="grade-display">
                        <span 
                          className="grade" 
                          style={{ color: getGradeColor(course.grade) }}
                        >
                          {course.grade}
                        </span>
                        <span className="points">({course.points})</span>
                      </div>
                    ) : (
                      <span className="status-badge status-inprogress">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                {course.status === 'In Progress' && (
                  <div className="course-progress">
                    <div className="progress-info">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="achievements-section">
          <div className="section-header">
            <h2>Recent Achievements</h2>
            <Award size={20} color="#6b7280" />
          </div>

          <div className="achievements-list">
            {achievements.map((achievement, index) => (
              <div key={index} className="achievement-card">
                <div className={`achievement-icon ${achievement.type}`}>
                  <achievement.icon size={24} />
                </div>
                <div className="achievement-content">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                  <span className="achievement-date">
                    {new Date(achievement.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Timeline */}
      <div className="timeline-section">
        <h2>Academic Timeline</h2>
        <div className="timeline">
          {Object.entries(semesterData).map(([sem, data]) => (
            <div key={sem} className={`timeline-item ${parseInt(sem) === selectedSemester ? 'current' : 'completed'}`}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h3>Semester {sem}</h3>
                <p>{data.courses.length} courses</p>
                {parseInt(sem) !== selectedSemester && (
                  <span className="semester-gpa">GPA: {calculateGPA(data.courses)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .student-progress {
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

        .progress-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .overview-card {
          background: white;
          border-radius: 12px;
          padding: 32px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .gpa-card {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .credits-card {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .semester-card {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .card-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-content h3 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .card-content p {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .gpa-scale,
        .semester-gpa {
          font-size: 14px;
          opacity: 0.8;
        }

        .credits-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          width: 100px;
          height: 6px;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }

        .progress-section,
        .achievements-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .section-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .courses-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .course-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .course-card:hover {
          background-color: #f8fafc;
        }

        .course-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
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

        .grade-display {
          text-align: right;
        }

        .grade {
          font-size: 20px;
          font-weight: 700;
        }

        .points {
          font-size: 14px;
          color: #6b7280;
          margin-left: 4px;
        }

        .status-inprogress {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .course-progress {
          margin-top: 12px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .course-progress .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
        }

        .course-progress .progress-fill {
          background-color: #10b981;
        }

        .achievements-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .achievement-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .achievement-card:hover {
          background-color: #f8fafc;
        }

        .achievement-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .achievement-icon.academic {
          background-color: #10b981;
        }

        .achievement-icon.competition {
          background-color: #f59e0b;
        }

        .achievement-icon.attendance {
          background-color: #3b82f6;
        }

        .achievement-content h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .achievement-content p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .achievement-date {
          font-size: 12px;
          color: #9ca3af;
        }

        .timeline-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .timeline-section h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 24px;
        }

        .timeline {
          display: flex;
          gap: 32px;
          align-items: center;
          overflow-x: auto;
          padding-bottom: 16px;
        }

        .timeline-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 120px;
          position: relative;
        }

        .timeline-marker {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #d1d5db;
          margin-bottom: 12px;
          position: relative;
        }

        .timeline-item.completed .timeline-marker {
          background-color: #10b981;
        }

        .timeline-item.current .timeline-marker {
          background-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }

        .timeline-content {
          text-align: center;
        }

        .timeline-content h3 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .timeline-content p {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .timeline-content .semester-gpa {
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .course-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .timeline {
            flex-direction: column;
            align-items: stretch;
          }

          .timeline-item {
            flex-direction: row;
            min-width: auto;
            padding: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }

          .timeline-marker {
            margin-bottom: 0;
            margin-right: 16px;
          }

          .timeline-content {
            text-align: left;
          }
        }
      `}</style>
    </div>
  )
}

export default StudentProgress