import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock users for demonstration
  const mockUsers = [
    {
      id: "admin001",
      password: "admin123",
      role: "admin",
      name: "Tamil",
      email: "admin@progova.com",
    },
    {
      id: "admin002",
      password: "admin124",
      role: "admin",
      name: "Saro",
      email: "admin@progova.com",
    },
    {
      id: "ST001",
      password: "student123",
      role: "student",
      name: "selva",
      email: "alice@student.com",
      course: "Computer Science",
      semester: 6,
      rollNumber: "CS2021001",
    },
    {
      id: "ST002",
      password: "student123",
      role: "student",
      name: "Guna",
      email: "bob@student.com",
      course: "Electronics",
      semester: 4,
      rollNumber: "EC2022002",
    },
  ];

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem("progovaUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (id, password) => {
    const foundUser = mockUsers.find(
      (u) => u.id === id && u.password === password
    );
    if (foundUser) {
      const userWithoutPassword = { ...foundUser };
      delete userWithoutPassword.password;
      setUser(userWithoutPassword);
      localStorage.setItem("progovaUser", JSON.stringify(userWithoutPassword));
      return { success: true };
    }
    return { success: false, error: "Invalid credentials" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("progovaUser");
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
