import React, { useState, useEffect } from "react";
import "./AutoPostSettings.css";
import api from "../services/api";

function AutoPostSettings() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [channels, setChannels] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [statusRes, contentsRes, channelsRes, historyRes] =
        await Promise.all([
          api.getAutoPostStatus(),
          api.getAllContents(),
          api.getChannels("all"),
          api.getAutoPostHistory(),
        ]);

      setStatus(statusRes.data.data);
      setHistory(historyRes.data.data || []);

      // Count pending contents
      const contents = contentsRes.data.contents || [];
      const pendingContents = contents.filter((c) => c.status === "pending");
      setPendingCount(pendingContents.length);

      // Parse channels from multi-platform response
      const allChannels = [];
      const channelResults = channelsRes.data.results || {};

      Object.keys(channelResults).forEach((platform) => {
        const platformData = channelResults[platform];
        if (platformData.success && platformData.channels) {
          platformData.channels.forEach((channel) => {
            allChannels.push({
              platform: platform,
              channelId: channel.id,
              channelName: channel.name,
            });
          });
        }
      });

      setChannels(allChannels);

      // Set selected items from config
      if (statusRes.data.data) {
        setSelectedChannels(statusRes.data.data.channels || []);
        setIntervalMinutes(statusRes.data.data.intervalMinutes || 60);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChannel = (channel) => {
    const channelKey = `${channel.platform}-${channel.channelId}`;
    const existingIndex = selectedChannels.findIndex(
      (ch) => `${ch.platform}-${ch.channelId}` === channelKey,
    );

    if (existingIndex >= 0) {
      setSelectedChannels((prev) => prev.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedChannels((prev) => [...prev, channel]);
    }
  };

  const isChannelSelected = (channel) => {
    const channelKey = `${channel.platform}-${channel.channelId}`;
    return selectedChannels.some(
      (ch) => `${ch.platform}-${ch.channelId}` === channelKey,
    );
  };

  const handleSaveConfig = async () => {
    try {
      await api.updateAutoPostConfig({
        channels: selectedChannels,
        intervalMinutes: parseInt(intervalMinutes),
      });

      alert("Đã lưu cấu hình");
      fetchData();
    } catch (err) {
      console.error("Error saving config:", err);
      alert("Không thể lưu cấu hình");
    }
  };

  const handleToggleEnabled = async () => {
    try {
      if (status?.enabled) {
        await api.disableAutoPost();
      } else {
        await api.enableAutoPost();
      }

      fetchData();
    } catch (err) {
      console.error("Error toggling auto-post:", err);
      alert(err.response?.data?.message || "Không thể thay đổi trạng thái");
    }
  };

  const handleRunNow = async () => {
    try {
      await api.runAutoPostNow();
      alert("Đã kích hoạt auto-post thủ công");

      // Refresh history after a short delay
      setTimeout(() => {
        fetchData();
      }, 2000);
    } catch (err) {
      console.error("Error running auto-post:", err);
      alert("Không thể kích hoạt auto-post");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusClass = (itemStatus) => {
    switch (itemStatus) {
      case "success":
        return "status-success";
      case "failed":
        return "status-failed";
      case "partial":
        return "status-partial";
      default:
        return "";
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
      <div className="settings-header">
        <h2>⏰ Tự động đăng bài</h2>
        <div className="header-actions">
          <div className="status-indicator">
            <span
              className={`status-dot ${status?.enabled ? "active" : ""}`}
            ></span>
            <span className="status-text">
              {status?.enabled ? "Đang hoạt động" : "Đã tắt"}
            </span>
          </div>
          <button
            className={`btn-toggle ${status?.enabled ? "btn-danger" : "btn-primary"}`}
            onClick={handleToggleEnabled}
          >
            {status?.enabled ? "Tắt" : "Bật"}
          </button>
          <button className="btn-secondary" onClick={handleRunNow}>
            Chạy ngay
          </button>
        </div>
      </div>

      <div className="settings-content">
        <div className="config-section">
          <h3>Nguồn nội dung</h3>
          <div className="info-box">
            <p>
              Hệ thống sẽ tự động lấy{" "}
              <strong>{pendingCount} nội dung pending</strong> để đăng.
            </p>
            <p className="info-note">
              💡 Nội dung chuyển sang trạng thái "pending" sau khi được gen
              xong, và chuyển sang "posted" sau khi đăng thành công.
            </p>
          </div>
        </div>

        <div className="config-section">
          <h3>Cấu hình kênh đăng bài</h3>
          <div className="channel-list">
            {channels.length === 0 ? (
              <p className="empty-message">Không có kênh nào khả dụng</p>
            ) : (
              channels.map((channel, index) => (
                <label key={index} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={isChannelSelected(channel)}
                    onChange={() => handleToggleChannel(channel)}
                  />
                  <span className="channel-info">
                    <span className="platform-badge">{channel.platform}</span>
                    {channel.channelName}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="config-section">
          <h3>Khoảng thời gian</h3>
          <div className="interval-input">
            <input
              type="number"
              min="1"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(e.target.value)}
            />
            <span>phút</span>
          </div>
        </div>

        <div className="config-actions">
          <button className="btn-primary" onClick={handleSaveConfig}>
            Lưu cấu hình
          </button>
        </div>
      </div>

      <div className="history-section">
        <div
          className="history-header"
          onClick={() => setShowHistory(!showHistory)}
        >
          <h3>📜 Lịch sử ({history.length})</h3>
          <span className="toggle-icon">{showHistory ? "▼" : "▶"}</span>
        </div>

        {showHistory && (
          <div className="history-list">
            {history.length === 0 ? (
              <p className="empty-message">Chưa có lịch sử</p>
            ) : (
              history.map((entry, index) => (
                <div
                  key={index}
                  className={`history-item ${getStatusClass(entry.status)}`}
                >
                  <div className="history-header-row">
                    <span className="history-time">
                      {formatDate(entry.timestamp)}
                    </span>
                    <span className={`history-status ${entry.status}`}>
                      {entry.status}
                    </span>
                  </div>

                  {entry.content && (
                    <div className="history-article">
                      <strong>Nội dung:</strong> {entry.content.title}
                      {entry.content.articleId && (
                        <span className="content-id">
                          {" "}
                          (ID: {entry.content.id})
                        </span>
                      )}
                    </div>
                  )}

                  {entry.channels && entry.channels.length > 0 && (
                    <div className="history-channels">
                      <strong>Kênh:</strong>
                      <ul>
                        {entry.channels.map((ch, chIndex) => (
                          <li
                            key={chIndex}
                            className={ch.success ? "success" : "failed"}
                          >
                            {ch.success ? "✓" : "✗"} {ch.platform} -{" "}
                            {ch.channelName}
                            {ch.postId && ` (ID: ${ch.postId})`}
                            {ch.error && ` - ${ch.error}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.errors && entry.errors.length > 0 && (
                    <div className="history-errors">
                      <strong>Lỗi:</strong>
                      <ul>
                        {entry.errors.map((err, errIndex) => (
                          <li key={errIndex}>
                            {err.channel && `${err.channel}: `}
                            {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AutoPostSettings;
