import axios from "axios";
import { useEffect, useState } from "react";
import "./PostManagement.css";

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_ENDPOINT}/api`;

function PostManagement() {
  const [contents, setContents] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewContent, setPreviewContent] = useState(null);
  const [postingContent, setPostingContent] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [posting, setPosting] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    summary: "",
    content: "",
    hashtags: "",
  });

  useEffect(() => {
    fetchContents();
    fetchPages();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/contents`);
      if (response.data.success) {
        setContents(response.data.contents);
      }
      console.log("Fetched contents:", response.data.contents);
    } catch (error) {
      console.error("Error fetching contents:", error);
      alert("Không thể tải danh sách nội dung");
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/facebook/pages`);
      if (response.data.pages) {
        setPages(response.data.pages);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const handlePreview = (content) => {
    setPreviewContent(content);
  };

  const handleOpenPostModal = (content) => {
    setPostingContent(content);
    setSelectedPages([]);
  };

  const handlePageToggle = (pageId) => {
    setSelectedPages((prev) =>
      prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId],
    );
  };

  const handlePost = async () => {
    if (selectedPages.length === 0) {
      alert("Vui lòng chọn ít nhất một fanpage");
      return;
    }

    try {
      setPosting(true);

      // Prepare channels data in the new format
      const channels = selectedPages.map((pageId) => {
        const page = pages.find((p) => p.id === pageId);
        return {
          platform: "facebook",
          channelId: pageId,
          channelName: page?.name || "Unknown",
        };
      });

      // Format hashtags with # prefix
      const formattedHashtags =
        postingContent.hashtags
          ?.map((tag) => {
            const cleanTag = tag.trim();
            return cleanTag.startsWith("#") ? cleanTag : `#${cleanTag}`;
          })
          .join(" ") || "";

      // Format message: Title (bold style with separators), Summary, Content, Hashtags
      const separator = "━━━━━━━━━━━━━━━━━━━━━━━";
      const message = [
        `📌 ${postingContent.title}`,
        separator,
        "",
        postingContent.summary,
        "",
        postingContent.content,
        "",
        `Nguồn: ${postingContent.source}`,
        "",
        formattedHashtags,
      ].join("\n");

      const postData = {
        message: message,
        link: postingContent.sourceUrl,
        localImagePath: postingContent.localImagePath, // Đường dẫn ảnh local đã download
        channels: channels,
      };

      const response = await axios.post(
        `${API_BASE_URL}/facebook/post`,
        postData,
      );

      if (response.data.success) {
        setPostingContent(null);
        setSelectedPages([]);
      } else {
        alert("Có lỗi xảy ra khi đăng bài");
      }
    } catch (error) {
      console.error("Error posting:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi đăng bài");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (content) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/contents/${content.id || content.articleId}`,
      );
      if (response.data.success) {
        fetchContents();
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      alert("Không thể xóa nội dung");
    }
  };

  const handleOpenEditModal = (content) => {
    setEditingContent(content);
    setEditForm({
      title: content.title || "",
      summary: content.summary || "",
      content: content.content || "",
      hashtags: content.hashtags?.join(", ") || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      alert("Vui lòng nhập tiêu đề");
      return;
    }

    try {
      const hashtagsArray = editForm.hashtags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const updateData = {
        title: editForm.title,
        summary: editForm.summary,
        content: editForm.content,
        hashtags: hashtagsArray,
      };

      const response = await axios.put(
        `${API_BASE_URL}/contents/${editingContent.id || editingContent.articleId}`,
        updateData,
      );

      if (response.data.success) {
        setEditingContent(null);
        fetchContents();
      }
    } catch (error) {
      console.error("Error updating content:", error);
      alert("Không thể cập nhật nội dung");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <div className="post-management">
      <div className="post-management-header">
        <h2>📊 Quản Lý Bài Đăng</h2>
        <p className="subtitle">
          Danh sách nội dung đã viết lại - {contents.length} bài
        </p>
      </div>

      <div className="post-management-content">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : contents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">📭</div>
              <p className="empty-title">Chưa có nội dung nào</p>
              <p className="empty-description">
                Thêm link bài viết ở mục Nội dung để hệ thống viết lại
              </p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="posts-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tiêu đề</th>
                  <th>Danh mục</th>
                  <th>Hashtags</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((content, index) => (
                  <tr key={content.id || content.articleId || index}>
                    <td>{index + 1}</td>
                    <td className="title-cell">{content.title || "N/A"}</td>
                    <td>
                      <span className="category-badge">
                        {content.category || "Chưa phân loại"}
                      </span>
                    </td>
                    <td className="hashtags-cell">
                      {content.hashtags
                        ?.slice(0, 3)
                        .map((tag) => {
                          const cleanTag = tag.trim();
                          return cleanTag.startsWith("#")
                            ? cleanTag
                            : `#${cleanTag}`;
                        })
                        .join(", ") || "N/A"}
                    </td>
                    <td>{formatDate(content.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-preview"
                          onClick={() => handlePreview(content)}
                          title="Xem trước"
                        >
                          👁️
                        </button>
                        <button
                          className="btn-edit"
                          onClick={() => handleOpenEditModal(content)}
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-post"
                          onClick={() => handleOpenPostModal(content)}
                          title="Đăng bài"
                        >
                          📤
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(content)}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewContent && (
        <div className="modal-overlay" onClick={() => setPreviewContent(null)}>
          <div
            className="modal-content preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>👁️ Xem trước nội dung</h3>
              <button
                className="modal-close"
                onClick={() => setPreviewContent(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="preview-section">
                <h4>📌 Tiêu đề</h4>
                <p className="preview-title">{previewContent.title}</p>
              </div>

              <div className="preview-section">
                <h4>📝 Tóm tắt</h4>
                <p className="preview-summary">{previewContent.summary}</p>
              </div>

              <div className="preview-section">
                <h4>📄 Nội dung</h4>
                <div className="preview-content-text">
                  {previewContent.content}
                </div>
              </div>

              <div className="preview-section">
                <h4>🏷️ Hashtags</h4>
                <div className="preview-hashtags">
                  {previewContent.hashtags?.map((tag, idx) => {
                    const cleanTag = tag.trim();
                    const formattedTag = cleanTag.startsWith("#")
                      ? cleanTag
                      : `#${cleanTag}`;
                    return (
                      <span key={idx} className="hashtag">
                        {formattedTag}
                      </span>
                    );
                  }) || "N/A"}
                </div>
              </div>

              <div className="preview-section">
                <h4>🔗 Nguồn</h4>
                <a
                  href={previewContent.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  {previewContent.source || previewContent.sourceUrl}
                </a>
              </div>

              {previewContent.imageUrl && (
                <div className="preview-section">
                  <h4>🖼️ Hình ảnh</h4>
                  <img
                    src={previewContent.imageUrl}
                    alt={previewContent.title}
                    className="preview-image"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingContent && (
        <div className="modal-overlay" onClick={() => setEditingContent(null)}>
          <div
            className="modal-content edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>✏️ Chỉnh sửa nội dung</h3>
              <button
                className="modal-close"
                onClick={() => setEditingContent(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="edit-form">
                <div className="form-group">
                  <label>📌 Tiêu đề:</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    placeholder="Nhập tiêu đề..."
                  />
                </div>

                <div className="form-group">
                  <label>📝 Tóm tắt:</label>
                  <textarea
                    value={editForm.summary}
                    onChange={(e) =>
                      setEditForm({ ...editForm, summary: e.target.value })
                    }
                    placeholder="Nhập tóm tắt..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>📄 Nội dung:</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) =>
                      setEditForm({ ...editForm, content: e.target.value })
                    }
                    placeholder="Nhập nội dung..."
                    rows="6"
                  />
                </div>

                <div className="form-group">
                  <label>🏷️ Hashtags (phân cách bằng dấu phẩy):</label>
                  <input
                    type="text"
                    value={editForm.hashtags}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hashtags: e.target.value })
                    }
                    placeholder="React, JavaScript, WebDev"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setEditingContent(null)}
                >
                  Hủy
                </button>
                <button className="btn-confirm" onClick={handleSaveEdit}>
                  💾 Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {postingContent && (
        <div className="modal-overlay" onClick={() => setPostingContent(null)}>
          <div
            className="modal-content post-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>📤 Đăng bài lên Facebook</h3>
              <button
                className="modal-close"
                onClick={() => setPostingContent(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="post-preview">
                <h4>Nội dung sẽ đăng:</h4>
                <div className="post-preview-text">
                  <div className="separator">━━━━━━━━━━━━━━━━━━━━━━━</div>
                  <p className="post-title">
                    <strong>📌 {postingContent.title}</strong>
                  </p>
                  <div className="separator">━━━━━━━━━━━━━━━━━━━━━━━</div>
                  <br />
                  <p className="post-summary">{postingContent.summary}</p>
                  <br />
                  <p className="post-content">{postingContent.content}</p>
                  <br />
                  <p className="post-hashtags">
                    {postingContent.hashtags
                      ?.map((tag) => {
                        const cleanTag = tag.trim();
                        return cleanTag.startsWith("#")
                          ? cleanTag
                          : `#${cleanTag}`;
                      })
                      .join(" ")}
                  </p>
                </div>
              </div>

              <div className="page-selection">
                <h4>Chọn Fanpage:</h4>
                {pages.length === 0 ? (
                  <p className="no-pages">
                    Chưa có fanpage nào. Vui lòng kết nối Facebook.
                  </p>
                ) : (
                  <div className="pages-list">
                    {pages.map((page) => (
                      <label key={page.id} className="page-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(page.id)}
                          onChange={() => handlePageToggle(page.id)}
                          disabled={posting}
                        />
                        <span className="page-name">{page.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setPostingContent(null)}
                  disabled={posting}
                >
                  Hủy
                </button>
                <button
                  className="btn-confirm"
                  onClick={handlePost}
                  disabled={posting || selectedPages.length === 0}
                >
                  {posting ? "Đang đăng..." : `Đăng (${selectedPages.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostManagement;
