import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Logo from "./components/Logo";
import SideNav from "./components/SideNav";
import PostPage from "./pages/PostPage";
import ContentPage from "./pages/ContentPage";
import PostManagementPage from "./pages/PostManagementPage";
import AutoPostPage from "./pages/AutoPostPage";

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Logo />
          <div className="header-content">
            <h1>🚀 Multi-Platform Auto Posting</h1>
            <p>
              Đăng bài tự động lên nhiều nền tảng: Facebook, Shopee, và nhiều
              hơn nữa
            </p>
          </div>
        </header>

        <div className="app-layout">
          <SideNav />

          <div className="main-content">
            <Routes>
              <Route path="/" element={<PostPage />} />
              <Route path="/content" element={<ContentPage />} />
              <Route path="/post-management" element={<PostManagementPage />} />
              <Route path="/auto-post" element={<AutoPostPage />} />
            </Routes>
          </div>
        </div>

        <footer className="App-footer">
          <p>© 2026 Multi-Platform Auto Posting System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
