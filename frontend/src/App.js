import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Home from "./Home";
import ManageAPIs from "./ManageAPIs";
import Settings from "./Settings";
import PublicTemplates from "./PublicTemplates";
import Report1 from './Report1';
import Report2 from './Report2';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/manage-apis" element={<ManageAPIs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/public-templates" element={<PublicTemplates />} />
        <Route path="/" element={<Signup />} />
         <Route path="/Report1" element={<Report1 />} />
        <Route path="/Report2" element={<Report2 />} />
      </Routes>
    </Router>
  );
}

export default App;