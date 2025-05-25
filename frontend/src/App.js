import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Home from "./Home";
import ManageAPIs from "./ManageAPIs";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/manage-apis" element={<ManageAPIs />} />
        <Route path="/" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;