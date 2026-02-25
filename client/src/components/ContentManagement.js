import React, { useState, useEffect } from "react";
import "./ContentManagement.css";
import api from "../services/api";

function ContentManagement() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLink, setNewLink] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getArticles();
      setArticles(response.data.articles || []);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Không thể tải danh sách bài báo");
    } finally {
      setLoading(false);
    }
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    if (!newLink.trim()) {
      alert("Vui lòng nhập link bài báo");
      return;
    }

    try {
      await api.addArticle({ link: newLink.trim() });
      setNewLink("");
      setShowAddForm(false);
      fetchArticles();
    } catch (err) {
      console.error("Error adding article:", err);
      alert("Không thể thêm bài báo");
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài báo này?")) {
      return;
    }

    try {
      await api.deleteArticle(id);
      fetchArticles();
    } catch (err) {
      console.error("Error deleting article:", err);
      alert("Không thể xóa bài báo");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    // Cycle through statuses: pending -> active -> inactive -> pending
    const statusCycle = {
      pending: "active",
      active: "inactive",
      inactive: "pending",
    };
    const newStatus = statusCycle[currentStatus] || "pending";

    try {
      await api.updateArticleStatus(id, newStatus);
      fetchArticles();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Không thể cập nhật trạng thái");
    }
  };

  const handleRegenerateArticle = async (id) => {
    if (!window.confirm("Crawl và gen lại nội dung cho bài báo này?")) {
      return;
    }

    try {
      await api.regenerateArticle(id);
      alert(
        "Đã bắt đầu crawl và gen lại nội dung. Vui lòng kiểm tra trong vài phút!",
      );
    } catch (err) {
      console.error("Error regenerating article:", err);
      alert("Không thể gen lại nội dung");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="content-management">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-management">
      <div className="content-header">
        <h2>📰 Quản Lý Nội Dung</h2>
        <button
          className="btn-add"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "✖ Hủy" : "➕ Thêm bài báo"}
        </button>
      </div>

      {error && (
        <div className="error-box">
          <p>❌ {error}</p>
          <button onClick={fetchArticles}>Thử lại</button>
        </div>
      )}

      {showAddForm && (
        <div className="add-form-container">
          <form className="add-form" onSubmit={handleAddArticle}>
            <div className="form-group">
              <label>Link bài báo:</label>
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://example.com/article"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit">
                Thêm bài báo
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowAddForm(false);
                  setNewLink("");
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="articles-section">
        <h3>Danh sách bài báo ({articles.length})</h3>

        {articles.length === 0 ? (
          <div className="empty-state">
            <p>📭 Chưa có bài báo nào</p>
            <p className="empty-hint">Nhấn "Thêm bài báo" để bắt đầu</p>
          </div>
        ) : (
          <div className="articles-table-container">
            <table className="articles-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Link Bài Báo</th>
                  <th>Ngày Tạo</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article, index) => (
                  <tr key={article.id}>
                    <td>{index + 1}</td>
                    <td className="link-cell">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={article.link}
                      >
                        {article.link.length > 50
                          ? article.link.substring(0, 50) + "..."
                          : article.link}
                      </a>
                    </td>
                    <td>{formatDate(article.createdAt)}</td>
                    <td>
                      <button
                        className={`status-badge ${article.status || "pending"}`}
                        onClick={() =>
                          handleToggleStatus(
                            article.id,
                            article.status || "pending",
                          )
                        }
                        title="Click để thay đổi trạng thái"
                      >
                        {article.status === "active" && "✓ Hoạt động"}
                        {article.status === "inactive" && "✖ Không hoạt động"}
                        {article.status === "pending" && "⏳ Pending"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-regenerate"
                        onClick={() => handleRegenerateArticle(article.id)}
                        title="Crawl và gen lại nội dung"
                      >
                        🔄 Gen lại
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteArticle(article.id)}
                        title="Xóa bài báo"
                      >
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentManagement;
