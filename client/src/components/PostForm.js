import React, { useState } from 'react';
import './PostForm.css';
import api from '../services/api';

function PostForm({ selectedChannels, onPostSuccess }) {
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview({
          url: reader.result,
          type: file.type.startsWith('video') ? 'video' : 'image'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedChannels.length === 0) {
      alert('Vui lòng chọn ít nhất một kênh!');
      return;
    }

    if (!message.trim()) {
      alert('Vui lòng nhập nội dung bài viết!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('channels', JSON.stringify(selectedChannels));
      
      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      const response = await api.postToChannels(formData);

      if (response.data.success) {
        setResult({
          success: true,
          message: response.data.message,
          results: response.data.results,
          summary: response.data.summary
        });

        // Clear form on success
        setMessage('');
        setMediaFile(null);
        setMediaPreview(null);
        
        if (onPostSuccess) {
          onPostSuccess();
        }
      }
    } catch (error) {
      console.error('Error posting:', error);
      setResult({
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi đăng bài',
        details: error.response?.data?.details
      });
    } finally {
      setLoading(false);
    }
  };

  // Group selected channels by platform for display
  const channelsByPlatform = {};
  selectedChannels.forEach(channel => {
    if (!channelsByPlatform[channel.platform]) {
      channelsByPlatform[channel.platform] = [];
    }
    channelsByPlatform[channel.platform].push(channel);
  });

  const platformIcons = {
    facebook: '📘',
    shopee: '🛍️',
    tiktok: '🎵',
    youtube: '▶️',
    instagram:  '📷'
  };

  return (
    <div className="post-form-container">
      <h2>✍️ Tạo bài viết</h2>
      
      {result && (
        <div className={`result-box ${result.success ? 'success' : 'error'}`}>
          <h3>{result.success ? '✅ Thành công!' : '❌ Có lỗi xảy ra'}</h3>
          <p>{result.message}</p>
          
          {result.summary && (
            <div className="summary">
              <p><strong>Tổng số:</strong> {result.summary.total}</p>
              <p><strong>Thành công:</strong> {result.summary.successful}</p>
              <p><strong>Thất bại:</strong> {result.summary.failed}</p>
            </div>
          )}
          
          {result.results && result.results.length > 0 && (
            <div className="details">
              <h4>Chi tiết:</h4>
              <ul>
                {result.results.map((r, index) => (
                  <li key={index} className={r.success ? 'success-item' : 'error-item'}>
                    <strong>{platformIcons[r.platform] || '📱'} {r.channelName}:</strong> 
                    {r.success ? ` ✅ Đã đăng (ID: ${r.postId})` : ` ❌ ${r.error}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <button onClick={() => setResult(null)}>Đóng</button>
        </div>
      )}

      {selectedChannels.length > 0 && (
        <div className="selected-channels-info">
          <h3>📌 Kênh đã chọn:</h3>
          {Object.keys(channelsByPlatform).map(platform => (
            <div key={platform} className="platform-group">
              <span className="platform-label">
                {platformIcons[platform] || '📱'} {platform}: 
              </span>
              <span className="channel-names">
                {channelsByPlatform[platform].map(c => c.channelName).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label>📝 Nội dung bài viết:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập nội dung bài viết của bạn..."
            rows="6"
            required
          />
        </div>

        <div className="form-group">
          <label>📷 Media (ảnh/video):</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              id="media-input"
            />
            <label htmlFor="media-input" className="file-input-label">
              {mediaFile ? mediaFile.name : 'Chọn file...'}
            </label>
            {mediaFile && (
              <button 
                type="button" 
                onClick={handleRemoveFile}
                className="remove-file-btn"
              >
                ❌
              </button>
            )}
          </div>
          <p className="file-hint">
            💡 Tip: Video có thể mất thời gian upload lâu hơn (tối đa 500MB)
          </p>
        </div>

        {mediaPreview && (
          <div className="media-preview">
            {mediaPreview.type === 'video' ? (
              <video src={mediaPreview.url} controls />
            ) : (
              <img src={mediaPreview.url} alt="Preview" />
            )}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || selectedChannels.length === 0}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Đang đăng bài...
              </>
            ) : (
              `🚀 Đăng lên ${selectedChannels.length} kênh${selectedChannels.length > 1 ? 's' : ''}`
            )}
          </button>
        </div>

        {selectedChannels.length === 0 && (
          <p className="warning">⚠️ Vui lòng chọn ít nhất một kênh phía trên</p>
        )}
      </form>
    </div>
  );
}

export default PostForm;
