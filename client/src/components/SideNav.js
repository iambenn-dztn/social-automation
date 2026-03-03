import React from "react";
import { NavLink } from "react-router-dom";
import "./SideNav.css";

function SideNav() {
  const menuItems = [
    { id: "post", path: "/", label: "Đăng bài", icon: "📝" },
    { id: "content", path: "/content", label: "Nội dung", icon: "📰" },
    {
      id: "post-management",
      path: "/post-management",
      label: "Quản Lý Bài đăng",
      icon: "📊",
    },
    {
      id: "auto-post",
      path: "/auto-post",
      label: "Tự động đăng",
      icon: "⏰",
    },
    {
      id: "token",
      path: "/token",
      label: "Quản lý Token",
      icon: "🔑",
    },
  ];

  return (
    <div className="side-nav">
      <nav className="side-nav-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            end={item.path === "/"}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default SideNav;
