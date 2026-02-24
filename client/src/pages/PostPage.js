import React, { useState, useEffect } from "react";
import "../App.css";
import PostForm from "../components/PostForm";
import ChannelList from "../components/ChannelList";
import History from "../components/History";
import api from "../services/api";

function PostPage() {
  const [channels, setChannels] = useState({});
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("post");

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getChannels("all");

      if (response.data.success) {
        setChannels(response.data.results);
      } else {
        setError("Không thể tải danh sách kênh");
      }
    } catch (err) {
      console.error("Error fetching channels:", err);
      setError(
        err.response?.data?.message ||
          "Không thể kết nối đến server. Vui lòng kiểm tra cấu hình.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (platform, channel) => {
    setSelectedChannels((prev) => {
      const exists = prev.some(
        (c) => c.platform === platform && c.channelId === channel.id,
      );

      if (exists) {
        return prev.filter(
          (c) => !(c.platform === platform && c.channelId === channel.id),
        );
      } else {
        return [
          ...prev,
          {
            platform: platform,
            channelId: channel.id,
            channelName: channel.name,
            accessToken: channel.accessToken,
          },
        ];
      }
    });
  };

  const handleSelectAll = () => {
    const allChannels = [];

    Object.keys(channels).forEach((platform) => {
      if (channels[platform].success && channels[platform].channels) {
        channels[platform].channels.forEach((channel) => {
          allChannels.push({
            platform: platform,
            channelId: channel.id,
            channelName: channel.name,
            accessToken: channel.accessToken,
          });
        });
      }
    });

    if (selectedChannels.length === allChannels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(allChannels);
    }
  };

  return (
    <div className="page-container">
      <div className="container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "post" ? "active" : ""}`}
            onClick={() => setActiveTab("post")}
          >
            📝 Đăng bài
          </button>
          <button
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📜 Lịch sử
          </button>
        </div>

        {activeTab === "post" ? (
          <div className="content">
            {error && (
              <div className="error-box">
                <p>❌ {error}</p>
                <button onClick={fetchChannels}>Thử lại</button>
              </div>
            )}

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Đang tải...</p>
              </div>
            ) : (
              <>
                <ChannelList
                  channels={channels}
                  selectedChannels={selectedChannels}
                  onChannelToggle={handleChannelToggle}
                  onSelectAll={handleSelectAll}
                />

                <PostForm
                  selectedChannels={selectedChannels}
                  onPostSuccess={() => {
                    // Optionally refresh or show success message
                  }}
                />
              </>
            )}
          </div>
        ) : (
          <History />
        )}
      </div>
    </div>
  );
}

export default PostPage;
