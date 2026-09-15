import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StudentLayout from '../../components/student/StudentLayout'
import StudentHome from './StudentHome'
import StudentAttendance from './StudentAttendance'
import StudentPlacements from './StudentPlacements'
import StudentProgress from './StudentProgress'
import StudentFeedback from './StudentFeedback'
import StudentNotifications from './StudentNotifications'

const StudentDashboard = () => {
  return (
    <StudentLayout>
      <Routes>
        <Route index element={<StudentHome />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="placements" element={<StudentPlacements />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="feedback" element={<StudentFeedback />} />
        <Route path="notifications" element={<StudentNotifications />} />
      </Routes>
    </StudentLayout>
  )
}

export default StudentDashboard