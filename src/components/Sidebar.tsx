import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Link } from "react-router-dom";

const menuItems = [
  {
    text: "Lens Mainet",
    icon: "https://img.cryptorank.io/coins/lens_protocol1733845125692.png",
    path: "/lens-protocol",
  },
  {
    text: "OG Labs",
    icon: "https://img.cryptorank.io/coins/0_g_labs1711467106027.png",
    path: "/og",
  },
  {
    text: "Monad",
    icon: "https://img.cryptorank.io/coins/monad1710498467135.png",
    path: "/monad",
  },
  {
    text: "Humanity Protocol",
    icon: "https://img.cryptorank.io/coins/humanity_protocol1709113797405.png",
    path: "/humanity-protocol",
  },
  {
    text: "Avalanche",
    icon: "https://img.cryptorank.io/coins/avalanche1629705441155.png",
    path: "/avalanche",
  },
  {
    text: "Deploy Contract",
    icon: "./deploy.svg",
    path: "/deploy",
  },
];

const Sidebar: React.FC = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        "& .MuiDrawer-paper": {
          width: 240,
          marginTop: "64px",
          boxSizing: "border-box",
          backgroundColor: "#1E293B",
          color: "#fff",
        },
      }}
    >
      <List>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton component={Link} to={item.path}>
              <ListItemIcon sx={{ color: "#fff", marginRight: 2 }}>
                <img style={{ width: 60 }} src={item.icon} />
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
