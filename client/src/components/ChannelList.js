import React from 'react';
import './ChannelList.css';

function ChannelList({ channels, selectedChannels, onChannelToggle, onSelectAll }) {
  // Group channels by platform
  const channelsByPlatform = {};
  
  Object.keys(channels).forEach(platform => {
    if (channels[platform].success && channels[platform].channels.length > 0) {
      channelsByPlatform[platform] = channels[platform].channels;
    }
  });

  const totalChannels = Object.values(channelsByPlatform).reduce((sum, ch) => sum + ch.length, 0);

  if (totalChannels === 0) {
    return (
      <div className="channel-list-empty">
        <p>⚠️ Không tìm thấy channel nào. Vui lòng kiểm tra cấu hình các platform.</p>
      </div>
    );
  }

  const platformIcons = {
    facebook: '📘',
    shopee: '🛍️',
    tiktok: '🎵',
    youtube: '▶️',
    instagram: '📷'
  };

  const platformColors = {
    facebook: '#4267B2',
    shopee: '#EE4D2D',
    tiktok: '#000000',
    youtube: '#FF0000',
    instagram: '#E4405F'
  };

  return (
    <div className="channel-list-container">
      <div className="channel-list-header">
        <h2>📡 Chọn Kênh ({selectedChannels.length}/{totalChannels})</h2>
        <button 
          className="select-all-btn"
          onClick={onSelectAll}
        >
          {selectedChannels.length === totalChannels ? '❌ Bỏ chọn tất cả' : '✅ Chọn tất cả'}
        </button>
      </div>

      {Object.keys(channelsByPlatform).map(platform => (
        <div key={platform} className="platform-section">
          <div className="platform-header" style={{ borderLeftColor: platformColors[platform] }}>
            <span className="platform-icon">{platformIcons[platform] || '📱'}</span>
            <h3>{platform.charAt(0).toUpperCase() + platform.slice(1)}</h3>
            <span className="platform-count">
              ({channelsByPlatform[platform].length} kênh)
            </span>
          </div>

          <div className="channel-list">
            {channelsByPlatform[platform].map(channel => {
              const channelKey = `${platform}-${channel.id}`;
              const isSelected = selectedChannels.some(
                c => c.platform === platform && c.channelId === channel.id
              );

              return (
                <div 
                  key={channelKey}
                  className={`channel-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onChannelToggle(platform, channel)}
                  style={{ borderColor: isSelected ? platformColors[platform] : '#e0e0e0' }}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => {}}
                  />
                  {channel.picture && (
                    <img 
                      src={channel.picture} 
                      alt={channel.name}
                      className="channel-picture"
                    />
                  )}
                  <div className="channel-info">
                    <h4>{channel.name}</h4>
                    <p className="channel-id">ID: {channel.id}</p>
                    {channel.status && (
                      <span className={`status-badge ${channel.status}`}>
                        {channel.status}
                      </span>
                    )}
                  </div>
                  <div className="checkmark">
                    {isSelected && '✓'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChannelList;
