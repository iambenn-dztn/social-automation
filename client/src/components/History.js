import React, { useState, useEffect } from 'react';
import './History.css';
import api from '../services/api';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getHistory();
      
      if (response.data.success) {
        setHistory(response.data.history);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Không thể tải lịch sử đăng bài');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Đang tải lịch sử...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <p>❌ {error}</p>
        <button onClick={fetchHistory}>Thử lại</button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <h2>📜 Lịch sử đăng bài</h2>
        <p>Chưa có lịch sử đăng bài nào.</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>📜 Lịch sử đăng bài ({history.length})</h2>
        <button onClick={fetchHistory} className="refresh-btn">
          🔄 Làm mới
        </button>
      </div>

      <div className="history-list">
        {history.map((entry) => {
          const successCount = entry.results.filter(r => r.success).length;
          const failCount = entry.results.filter(r => !r.success).length;
          
          return (
            <div key={entry.id} className="history-item">
              <div className="history-item-header">
                <span className="history-date">🕐 {formatDate(entry.timestamp)}</span>
                <div className="history-stats">
                  <span className="success-count">✅ {successCount}</span>
                  {failCount > 0 && <span className="fail-count">❌ {failCount}</span>}
                </div>
              </div>
              
              <div className="history-content">
                <p className="history-message">{entry.message}</p>
                {entry.mediaFile && (
                  <p className="history-media">
                    📎 {entry.mediaFile.includes('video') || entry.mediaFile.includes('mp4') ? '🎥 Video' : '🖼️ Hình ảnh'}
                  </p>
                )}
              </div>

              <div className="history-results">
                <h4>Kết quả đăng:</h4>
                <ul>
                  {entry.results.map((result, index) => (
                    <li 
                      key={index} 
                      className={result.success ? 'result-success' : 'result-fail'}
                    >
                      <strong>{result.pageName}:</strong>{' '}
                      {result.success ? (
                        <span className="success-text">✅ Thành công</span>
                      ) : (
                        <span className="error-text">❌ {result.error}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default History;
