import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminHome from './AdminHome'
import StudentManagement from './StudentManagement'
import AttendanceManagement from './AttendanceManagement'
import PlacementManagement from './PlacementManagement'
import FeedbackManagement from './FeedbackManagement'
import MessageCenter from './MessageCenter'

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="placements" element={<PlacementManagement />} />
        <Route path="feedback" element={<FeedbackManagement />} />
        <Route path="messages" element={<MessageCenter />} />
      </Routes>
    </AdminLayout>
  )
}

export default AdminDashboard