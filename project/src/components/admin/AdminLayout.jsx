import React from "react";
import {
  Home,
  Users,
  Calendar,
  Briefcase,
  MessageSquare,
  Send,
} from "lucide-react";
import AppShell from "../shared/AppShell";

const AdminLayout = ({ children }) => {
  const navItems = [
    { path: "/admin", label: "Dashboard", icon: Home, exact: true },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/attendance", label: "Attendance", icon: Calendar },
    { path: "/admin/placements", label: "Placements", icon: Briefcase },
    { path: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    { path: "/admin/messages", label: "Messages", icon: Send },
  ];

  return <AppShell role="admin" navItems={navItems}>{children}</AppShell>;
};

export default AdminLayout;
