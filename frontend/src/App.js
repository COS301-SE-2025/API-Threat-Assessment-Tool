// src/App.js

import React, { createContext, useState, useEffect } from "react";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./AuthContext";

import { TimezoneProvider } from './TimezoneContext'; 

import ProtectedRoute from "./ProtectedRoute";

import LandingPage from "./LandingPage";

import Security from "./Security";

import Signup from "./Signup";

import Login from "./Login";

import Contact from "./Contact";

import Dashboard from "./Dashboard";

import Home from "./Home";

import TermsOfService from "./TermsOfService";

import Documentation from "./Documentation";

import Construction from "./Construction";

import ManageAPIs from "./ManageAPIs";

import Settings from "./Settings";

import ForgotPassword from "./ForgotPassword";

import PrivacyPolicy from './PrivacyPolicy';

import Recover from "./Recover";





export const ThemeContext = createContext();



function App() {



  const [darkMode, setDarkMode] = useState(() => {



    const savedTheme = localStorage.getItem("darkMode");

    return savedTheme ? JSON.parse(savedTheme) : false;

  });









  useEffect(() => {



    localStorage.setItem("darkMode", JSON.stringify(darkMode));



    document.body.classList.toggle("dark-mode", darkMode);



    document.documentElement.classList.toggle("dark-mode", darkMode);

  }, [darkMode]);





  const toggleDarkMode = () => {

    setDarkMode((prevMode) => !prevMode);

  };



  return (

    <AuthProvider>

      <TimezoneProvider> 

      <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>

          <div className={darkMode ? 'app dark-mode' : 'app'}>

            <Router>

              <Routes>

                <Route path="/landing" element={<LandingPage />} />

                <Route path="/signup" element={<Signup />} />

                <Route path="/login" element={<Login />} />

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

                  path="/terms" 

                  element={

                      <TermsOfService />

                  } 

                />

                <Route 

                  path="/security" 

                  element={

                      <Security />

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

                  path="/contact" 

                  element={

                      <Contact />

                  } 

                />

                <Route path="/privacy" element={<PrivacyPolicy />} />

                <Route 

                  path="/documentation" 

                  element={

                    <ProtectedRoute>

                      <Documentation />

                    </ProtectedRoute>

                  } 

                />

                <Route 

                path="/forgot-password" 

                element={

                <ForgotPassword />

              }

                 />

                <Route

                 path="/recover"

                  element={

                  <Recover />

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

      </ThemeContext.Provider>

      </TimezoneProvider>

    </AuthProvider>

  );

}



export default App;
