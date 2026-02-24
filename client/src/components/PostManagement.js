import React from "react";
import "./PostManagement.css";

function PostManagement() {
  return (
    <div className="post-management">
      <div className="post-management-header">
        <h2>📊 Quản Lý Bài Đăng</h2>
        <p className="subtitle">
          Theo dõi và quản lý các bài đăng trên tất cả nền tảng
        </p>
      </div>

      <div className="post-management-content">
        <div className="table-container">
          <table className="posts-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tiêu đề</th>
                <th>Nền tảng</th>
                <th>Kênh</th>
                <th>Ngày đăng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7" className="empty-state">
                  <div className="empty-content">
                    <div className="empty-icon">📭</div>
                    <p className="empty-title">Chưa có bài đăng nào</p>
                    <p className="empty-description">
                      Danh sách bài đăng sẽ hiển thị ở đây sau khi bạn tạo bài
                      đăng mới
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PostManagement;
