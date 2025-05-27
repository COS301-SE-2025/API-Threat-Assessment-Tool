import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Home from "./Home";
import ManageAPIs from "./ManageAPIs";
import Settings from "./Settings";
import PublicTemplates from "./PublicTemplates";
import Reports from "./Reports";
import StartScan from "./StartScan.js";
import Documentation from "./Documentation";
import Construction from "./Construction";

function App() {
  return (
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
  );
}

export default App;