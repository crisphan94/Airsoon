import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LensProtocol from "./pages/LensProtocol";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="lens-protocol" element={<LensProtocol />} />
          </Route>
      </Routes>
    </Router>
  );
};

export default App;
