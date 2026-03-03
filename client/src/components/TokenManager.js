import React, { useState, useEffect } from "react";
import "./TokenManager.css";
import api from "../services/api";

function TokenManager() {
  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [shortLivedToken, setShortLivedToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTokenInfo();
  }, []);

  const fetchTokenInfo = async () => {
    try {
      setLoading(true);
      const response = await api.getTokenInfo();
      setTokenInfo(response.data.data);
    } catch (err) {
      console.error("Error fetching token info:", err);
      setMessage({
        type: "error",
        text: "Không thể lấy thông tin token",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setRefreshing(true);
      setMessage(null);

      const response = await api.refreshFacebookToken(shortLivedToken || null);

      if (response.data.success) {
        setMessage({
          type: "success",
          text: response.data.message,
        });
        setShowTokenInput(false);
        setShortLivedToken("");

        // Refresh token info
        setTimeout(() => {
          fetchTokenInfo();
        }, 1000);
      }
    } catch (err) {
      console.error("Error refreshing token:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Không thể refresh token",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="token-manager">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="token-manager">
      <div className="header">
        <h2>🔑 Quản lý Facebook Token</h2>
        <button className="btn-refresh" onClick={fetchTokenInfo}>
          ↻ Làm mới
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {!tokenInfo?.configured ? (
        <div className="info-box warning">
          <h3>⚠️ Chưa cấu hình Token</h3>
          <p>Vui lòng cấu hình Facebook Access Token trong file .env</p>
          <ol>
            <li>
              Vào{" "}
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Graph API Explorer
              </a>
            </li>
            <li>Chọn ứng dụng của bạn</li>
            <li>
              Request quyền: pages_show_list, pages_read_engagement,
              pages_manage_posts
            </li>
            <li>Click "Generate Access Token"</li>
            <li>Copy token và thêm vào .env file</li>
          </ol>
        </div>
      ) : (
        <div className="token-info-section">
          <div className="info-card">
            <h3>Thông tin Token hiện tại</h3>
            <div className="info-row">
              <span className="label">Trạng thái:</span>
              <span
                className={`status ${tokenInfo.validated ? "valid" : "invalid"}`}
              >
                {tokenInfo.validated ? "✓ Hợp lệ" : "✗ Không hợp lệ"}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Loại token:</span>
              <span className="value">
                {tokenInfo.isPageToken
                  ? "Page Token (Tốt nhất ✓)"
                  : "User Token"}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Hết hạn:</span>
              <span className="value">{tokenInfo.expiresAtReadable}</span>
            </div>
            {tokenInfo.scopes && tokenInfo.scopes.length > 0 && (
              <div className="info-row">
                <span className="label">Quyền:</span>
                <div className="scopes">
                  {tokenInfo.scopes.map((scope, index) => (
                    <span key={index} className="scope-badge">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="refresh-section">
            <h3>Refresh Token</h3>

            {tokenInfo.isPageToken ? (
              <div className="info-box success">
                <p>
                  ✅ Token hiện tại đã là <strong>Page Access Token</strong> -
                  không bao giờ hết hạn.
                </p>
                <p>
                  Nếu cần đổi sang Page khác hoặc thêm quyền mới, vui lòng nhập
                  SHORT-LIVED USER TOKEN mới từ Graph API Explorer.
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => setShowTokenInput(true)}
                >
                  📝 Nhập token mới
                </button>
              </div>
            ) : (
              <>
                <p className="help-text">
                  Token hiện tại là User Token (hết hạn sau{" "}
                  {tokenInfo.expiresAtReadable}). Refresh để có Page Token không
                  bao giờ hết hạn.
                </p>

                {!showTokenInput ? (
                  <div className="refresh-options">
                    <button
                      className="btn-primary"
                      onClick={() => handleRefreshToken()}
                      disabled={refreshing}
                    >
                      {refreshing
                        ? "Đang refresh..."
                        : "🔄 Refresh token hiện tại"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowTokenInput(true)}
                    >
                      📝 Nhập token mới
                    </button>
                  </div>
                ) : (
                  <div className="token-input-section">
                    <input
                      type="text"
                      value={shortLivedToken}
                      onChange={(e) => setShortLivedToken(e.target.value)}
                      placeholder="Paste short-lived token từ Graph API Explorer"
                      className="token-input"
                    />
                    <div className="button-group">
                      <button
                        className="btn-primary"
                        onClick={handleRefreshToken}
                        disabled={refreshing || !shortLivedToken.trim()}
                      >
                        {refreshing ? "Đang refresh..." : "Refresh"}
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => {
                          setShowTokenInput(false);
                          setShortLivedToken("");
                        }}
                        disabled={refreshing}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {showTokenInput && tokenInfo.isPageToken && (
              <div className="token-input-section">
                <input
                  type="text"
                  value={shortLivedToken}
                  onChange={(e) => setShortLivedToken(e.target.value)}
                  placeholder="Paste short-lived token từ Graph API Explorer"
                  className="token-input"
                />
                <div className="button-group">
                  <button
                    className="btn-primary"
                    onClick={handleRefreshToken}
                    disabled={refreshing || !shortLivedToken.trim()}
                  >
                    {refreshing ? "Đang refresh..." : "Refresh"}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowTokenInput(false);
                      setShortLivedToken("");
                    }}
                    disabled={refreshing}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="info-box">
            <h4>💡 Hướng dẫn:</h4>
            <ol>
              <li>
                Thêm <strong>FACEBOOK_APP_ID</strong> và{" "}
                <strong>FACEBOOK_APP_SECRET</strong> vào file .env
              </li>
              <li>Click "Refresh token hiện tại" để tự động refresh</li>
              <li>
                Hoặc lấy token mới từ{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Graph API Explorer
                </a>{" "}
                và nhập vào
              </li>
              <li>
                Token sau khi refresh sẽ là Page Token (không bao giờ hết hạn)
              </li>
              <li>Khởi động lại server sau khi refresh thành công</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenManager;
