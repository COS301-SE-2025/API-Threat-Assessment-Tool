import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import Signup from "./Signup";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Home from "./Home";
import Reports from "./Reports";
import StartScan from "./StartScan";
import Documentation from "./Documentation";
import Construction from "./Construction";
import ManageAPIs from "./ManageAPIs";
import Settings from "./Settings";
import PublicTemplates from "./PublicTemplates";

// Define ThemeContext at the top level and export it
export const ThemeContext = createContext();

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check if dark mode preference is stored in localStorage
    const savedTheme = localStorage.getItem("darkMode");
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    // Apply theme to document body
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  return (
    <AuthProvider>
      <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-apis" 
              element={
                <ProtectedRoute>
                  <ManageAPIs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/public-templates" 
              element={
                <ProtectedRoute>
                  <PublicTemplates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/start-scan" 
              element={
                <ProtectedRoute>
                  <StartScan />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/documentation" 
              element={
                <ProtectedRoute>
                  <Documentation />
                </ProtectedRoute>
              } 
            />
            
            {/* Root route - redirect to dashboard if authenticated, otherwise to login */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
            
            {/* Catch-all route for undefined paths */}
            <Route path="*" element={<Construction />} />
          </Routes>
        </Router>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}

export default App;