import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/manage-apis" element={<ManageAPIs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/public-templates" element={<PublicTemplates />} />
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="*" element={<Construction />} /> {/* Catch-all route */}
        <Route path="/" element={<Signup />} />
      </Routes>
    </Router>
    </ThemeContext.Provider>
  );
}

export default App;