import React from 'react'
import { 
  Home, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  MessageSquare, 
  Bell, 
} from 'lucide-react'
import AppShell from '../shared/AppShell'

const StudentLayout = ({ children }) => {
  const navItems = [
    { path: '/student', label: 'Dashboard', icon: Home, exact: true },
    { path: '/student/attendance', label: 'Attendance', icon: Calendar },
    { path: '/student/placements', label: 'Placements', icon: Briefcase },
    { path: '/student/progress', label: 'Progress', icon: TrendingUp },
    { path: '/student/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/student/notifications', label: 'Notifications', icon: Bell },
  ]

  return <AppShell role="student" navItems={navItems}>{children}</AppShell>
}

export default StudentLayout