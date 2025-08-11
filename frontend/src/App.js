// src/App.js
import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import LandingPage from "./LandingPage";
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
import ScanReport from "./ScanReport";
import ImportAPI from "./ImportAPI";
// Import the scan simulation module
import { ScanSimulation } from "./scanSimulation";

// Define ThemeContext at the top level and export it
export const ThemeContext = createContext();

// Make ScanSimulation available globally through context
export const ScanContext = createContext();

/**
 * Main Application Component
 * 
 * Handles routing, theme management, and global context providers.
 * Features:
 * - Theme persistence in localStorage
 * - Global scan simulation context
 * - Protected route authentication
 * - Landing page for non-authenticated users
 * - Comprehensive routing structure
 */
function App() {
  // Theme state management with localStorage persistence
  const [darkMode, setDarkMode] = useState(() => {
    // Check if dark mode preference is stored in localStorage
    const savedTheme = localStorage.getItem("darkMode");
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  // Create a single instance of ScanSimulation for the entire app
  const [scanSimulation] = useState(() => new ScanSimulation());

  // Handle theme changes and persistence
  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    // Apply theme to document body
    document.body.classList.toggle("dark-mode", darkMode);
    // Add dark mode class to html element for better coverage
    document.documentElement.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  /**
   * Toggle dark mode theme
   */
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  return (
    <AuthProvider>
      <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
        <ScanContext.Provider value={{ scanSimulation }}>
          <div className={darkMode ? 'app dark-mode' : 'app'}>
            <Router>
              <Routes>
                {/* Landing Page - Public route for marketing */}
                <Route path="/landing" element={<LandingPage />} />
                
                {/* Authentication routes - Public */}
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                
                {/* Main application routes - Protected */}
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
                
                {/* Scan-related routes - Protected */}
                <Route 
                  path="/scan/:scanId" 
                  element={
                    <ProtectedRoute>
                      <StartScan />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/scan-progress/:scanId" 
                  element={
                    <ProtectedRoute>
                      <StartScan />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/scan-report/:scanId" 
                  element={
                    <ProtectedRoute>
                      <ScanReport />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/report/:reportId" 
                  element={
                    <ProtectedRoute>
                      <ScanReport />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/details/:scanId" 
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/progress/:scanId" 
                  element={
                    <ProtectedRoute>
                      <StartScan />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guide/:guideId" 
                  element={
                    <ProtectedRoute>
                      <Documentation />
                    </ProtectedRoute>
                  } 
                />
                
                {/* API Import route - Protected */}
                <Route
                  path="/import-api"
                  element={
                    <ProtectedRoute>
                      <ImportAPI />
                    </ProtectedRoute>
                  }
                />

                {/* Root route - Smart redirect based on authentication */}
                <Route 
                  path="/" 
                  element={<Navigate to="/landing" replace />} 
                />
                
                {/* Catch-all route for undefined paths */}
                <Route 
                  path="*" 
                  element={
                    <ProtectedRoute>
                      <Construction />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Router>
          </div>
        </ScanContext.Provider>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}

export default App;