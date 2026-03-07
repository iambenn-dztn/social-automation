import React, { useState, useEffect } from "react";
import "./AutoPostSettings.css";
import api from "../services/api";

function AutoPostSettings() {
  const [loading, setLoading] = useState(true);
  const [hotCrawlerActive, setHotCrawlerActive] = useState(false);
  const [hotCrawlerRunning, setHotCrawlerRunning] = useState(false);
  const [cronPattern, setCronPattern] = useState("*/10 * * * *");
  const [articlesPerRun, setArticlesPerRun] = useState(1);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [statusRes, configRes] = await Promise.all([
        api.getAutoPostStatus(),
        api.getHotCrawlerConfig(),
      ]);

      setHotCrawlerActive(statusRes.data.data?.hotCrawlerActive || false);
      setHotCrawlerRunning(statusRes.data.data?.hotCrawlerRunning || false);

      if (configRes.data.data) {
        setCronPattern(configRes.data.data.cronPattern || "*/10 * * * *");
        setArticlesPerRun(configRes.data.data.articlesPerRun || 1);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await api.updateHotCrawlerConfig({
        cronPattern,
        articlesPerRun: parseInt(articlesPerRun),
      });

      alert("Đã lưu cấu hình. Vui lòng khởi động lại crawler nếu đang chạy.");
      fetchData();
    } catch (err) {
      console.error("Error saving config:", err);
      alert(err.response?.data?.message || "Không thể lưu cấu hình");
    }
  };

  const handleToggleHotCrawler = async () => {
    try {
      if (hotCrawlerActive) {
        await api.stopHotCrawler();
        alert("Đã tắt Hot Articles Crawler");
      } else {
        await api.startHotCrawler();
        alert("Đã bật Hot Articles Crawler (chạy mỗi 10 phút)");
      }
      fetchData();
    } catch (err) {
      console.error("Error toggling hot crawler:", err);
      alert(err.response?.data?.message || "Không thể thay đổi trạng thái");
    }
  };

  const handleCrawlAndAutoPost = async () => {
    const confirmMsg =
      "Hệ thống sẽ:\n" +
      "1. Crawl bài viết từ VnExpress và Dân Trí\n" +
      "2. Chọn 1 bài tốt nhất\n" +
      "3. Rewrite và đăng lên tất cả page\n\n" +
      "Tiếp tục?";

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await api.crawlAndAutoPost();
      alert("Đã bắt đầu crawl và auto-post. Kiểm tra logs để theo dõi.");
      setTimeout(() => {
        fetchData();
      }, 3000);
    } catch (err) {
      console.error("Error running crawl and auto-post:", err);
      alert("Không thể kích hoạt crawl and auto-post");
    }
  };

  if (loading) {
    return (
      <div className="auto-post-settings">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auto-post-settings">
      {/* Hot Articles Crawler Section */}
      <div className="settings-content hot-crawler-section">
        <div className="section-header">
          <h3>🔥 Hot Articles Auto-Poster</h3>
          <div className="header-actions">
            <div className="status-indicator">
              <span
                className={`status-dot ${hotCrawlerActive ? "active" : ""}`}
              ></span>
              <span className="status-text">
                {hotCrawlerActive ? "Đang hoạt động" : "Đã tắt"}
              </span>
              {hotCrawlerRunning && (
                <span className="running-badge">⚡ Đang chạy...</span>
              )}
            </div>
            <button
              className={`btn-toggle ${hotCrawlerActive ? "btn-danger" : "btn-primary"}`}
              onClick={handleToggleHotCrawler}
            >
              {hotCrawlerActive ? "Tắt" : "Bật"}
            </button>
            <button className="btn-secondary" onClick={handleCrawlAndAutoPost}>
              Chạy ngay
            </button>
          </div>
        </div>

        <div className="info-box hot-crawler-info">
          <h4>📋 Cách hoạt động:</h4>
          <ul>
            <li>
              ⏱️ <strong>Tự động chạy theo lịch</strong>
            </li>
            <li>
              📰 Crawl bài hot từ <strong>VnExpress</strong> và{" "}
              <strong>Dân Trí</strong>
            </li>
            <li>
              🎯 Đánh giá và chọn <strong>bài tốt nhất</strong> (drama, giá
              vàng, chính trị...)
            </li>
            <li>
              ✍️ <strong>Rewrite riêng</strong> cho từng page (nội dung khác
              nhau)
            </li>
            <li>
              🚀 Đăng lên <strong>tất cả page</strong> đã kết nối
            </li>
            <li>
              🔒 <strong>Tự động lọc trùng</strong> - không đăng bài đã post
            </li>
          </ul>

          <div className="crawler-stats">
            <div className="stat-item">
              <span className="stat-label">Lịch chạy:</span>
              <span className="stat-value">{cronPattern}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Nguồn:</span>
              <span className="stat-value">VnExpress + Dân Trí</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Số bài/lần:</span>
              <span className="stat-value">{articlesPerRun} bài</span>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="config-section">
          <div
            className="config-header"
            onClick={() => setShowConfig(!showConfig)}
          >
            <h4>⚙️ Cấu hình</h4>
            <span className="toggle-icon">{showConfig ? "▼" : "▶"}</span>
          </div>

          {showConfig && (
            <div className="config-content">
              <div className="config-item">
                <label>
                  <strong>Cron Pattern:</strong>
                  <span className="help-text">
                    (Ví dụ: */10 * * * * = mỗi 10 phút)
                  </span>
                </label>
                <input
                  type="text"
                  value={cronPattern}
                  onChange={(e) => setCronPattern(e.target.value)}
                  placeholder="*/10 * * * *"
                />
                <div className="cron-examples">
                  <button
                    className="btn-example"
                    onClick={() => setCronPattern("*/10 * * * *")}
                  >
                    Mỗi 10 phút
                  </button>
                  <button
                    className="btn-example"
                    onClick={() => setCronPattern("*/30 * * * *")}
                  >
                    Mỗi 30 phút
                  </button>
                  <button
                    className="btn-example"
                    onClick={() => setCronPattern("0 * * * *")}
                  >
                    Mỗi giờ
                  </button>
                  <button
                    className="btn-example"
                    onClick={() => setCronPattern("0 */2 * * *")}
                  >
                    Mỗi 2 giờ
                  </button>
                </div>
              </div>

              <div className="config-item">
                <label>
                  <strong>Số bài mỗi lần chạy:</strong>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={articlesPerRun}
                  onChange={(e) => setArticlesPerRun(e.target.value)}
                />
                <span className="help-text">(Từ 1 đến 10 bài)</span>
              </div>

              <div className="config-actions">
                <button className="btn-primary" onClick={handleSaveConfig}>
                  💾 Lưu cấu hình
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutoPostSettings;
