import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";
import useFilteredAccounts from "../hooks/useFilteredAccounts";

const Header: React.FC = () => {
  const accounts = useFilteredAccounts();

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, textAlign: "center" }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" noWrap component="div">
          AirSoon
        </Typography>
        <Typography
          sx={{ fontWeight: "bold", fontSize: "12px" }}
          noWrap
          component="div"
        >
          {accounts.map((acc) => acc.name).join(", ")}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
