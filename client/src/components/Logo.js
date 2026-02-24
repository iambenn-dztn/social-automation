import React from "react";
import "./Logo.css";

function Logo() {
  return (
    <div className="logo-container">
      <svg
        className="logo-svg"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circle - Orange Gradient */}
        <defs>
          <linearGradient
            id="orangeGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{ stopColor: "#FF6B35", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#FF8C42", stopOpacity: 1 }}
            />
          </linearGradient>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: "#004E89", stopOpacity: 1 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: "#1A535C", stopOpacity: 1 }}
            />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="url(#orangeGradient)"
          opacity="0.2"
        />

        {/* Main "M" Letter for Media/Marketing */}
        <path
          d="M 60 140 L 60 60 L 85 95 L 110 60 L 110 140"
          stroke="url(#orangeGradient)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Decorative Wave - Representing Communication/Social */}
        <path
          d="M 120 100 Q 130 85, 145 100 T 170 100"
          stroke="url(#blueGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Small Dots - Representing Network/Connection */}
        <circle cx="145" cy="75" r="6" fill="#FF6B35" />
        <circle cx="165" cy="85" r="5" fill="#FF8C42" />
        <circle cx="155" cy="115" r="4" fill="#004E89" />
      </svg>
      <div className="logo-text">
        <span className="logo-title">Multi-Platform</span>
        <span className="logo-subtitle">Auto Posting</span>
      </div>
    </div>
  );
}

export default Logo;
