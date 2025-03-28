import React from "react";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const AdminLayout: React.FC = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Header />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 2, backgroundColor: "#f3f4f6", minHeight: "100vh", width: '100%' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
