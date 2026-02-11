import React from 'react';
import './PageList.css';

function PageList({ pages, selectedPages, onPageToggle, onSelectAll }) {
  if (pages.length === 0) {
    return (
      <div className="page-list-empty">
        <p>⚠️ Không tìm thấy fanpage nào. Vui lòng kiểm tra cấu hình Facebook Access Token.</p>
      </div>
    );
  }

  return (
    <div className="page-list-container">
      <div className="page-list-header">
        <h2>📄 Chọn Fanpage ({selectedPages.length}/{pages.length})</h2>
        <button 
          className="select-all-btn"
          onClick={onSelectAll}
        >
          {selectedPages.length === pages.length ? '❌ Bỏ chọn tất cả' : '✅ Chọn tất cả'}
        </button>
      </div>
      
      <div className="page-list">
        {pages.map(page => (
          <div 
            key={page.id} 
            className={`page-item ${selectedPages.includes(page.id) ? 'selected' : ''}`}
            onClick={() => onPageToggle(page.id)}
          >
            <input 
              type="checkbox" 
              checked={selectedPages.includes(page.id)}
              onChange={() => {}}
            />
            {page.picture && (
              <img 
                src={page.picture} 
                alt={page.name}
                className="page-picture"
              />
            )}
            <div className="page-info">
              <h3>{page.name}</h3>
              <p className="page-id">ID: {page.id}</p>
            </div>
            <div className="checkmark">
              {selectedPages.includes(page.id) && '✓'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageList;
