import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LensProtocol from "./pages/LensProtocol";
// import HumanityProtocol from "./pages/HumanityProtocol";
import Monad from "./pages/Monad";
import OGLabs from "./pages/OGLabs";
import Avalanche from "./pages/Avalanche";
import DeployContract from "./pages/DeployContract";
import Ink from "./pages/Ink";
import Unichain from "./pages/Unichain";
import Pharos from "./pages/Pharos";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="lens-protocol" element={<LensProtocol />} />
          <Route path="og" element={<OGLabs />} />
          <Route path="monad" element={<Monad />} />
          {/* <Route path="humanity-protocol" element={<HumanityProtocol />} /> */}
          <Route path="avalanche" element={<Avalanche />} />
          <Route path="deploy" element={<DeployContract />} />
          <Route path="ink" element={<Ink />} />
          <Route path="unichain" element={<Unichain />} />
          <Route path="pharos" element={<Pharos />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
