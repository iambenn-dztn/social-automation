import React, { useState, useEffect } from 'react';
import './App.css';
import PostForm from './components/PostForm';
import PageList from './components/PageList';
import History from './components/History';
import api from './services/api';

function App() {
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('post'); // 'post' or 'history'

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPages();
      
      if (response.data.success) {
        setPages(response.data.pages);
      } else {
        setError('Không thể tải danh sách fanpage');
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến server. Vui lòng kiểm tra cấu hình.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageToggle = (pageId) => {
    setSelectedPages(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPages.length === pages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(pages.map(page => page.id));
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📱 Facebook Auto Posting System</h1>
        <p>Đăng bài tự động lên nhiều fanpage</p>
      </header>

      <div className="container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'post' ? 'active' : ''}`}
            onClick={() => setActiveTab('post')}
          >
            📝 Đăng bài
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Lịch sử
          </button>
        </div>

        {activeTab === 'post' ? (
          <div className="content">
            {error && (
              <div className="error-box">
                <p>❌ {error}</p>
                <button onClick={fetchPages}>Thử lại</button>
              </div>
            )}

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Đang tải...</p>
              </div>
            ) : (
              <>
                <PageList 
                  pages={pages}
                  selectedPages={selectedPages}
                  onPageToggle={handlePageToggle}
                  onSelectAll={handleSelectAll}
                />
                
                <PostForm 
                  selectedPages={selectedPages}
                  pages={pages}
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

      <footer className="App-footer">
        <p>© 2026 Facebook Auto Posting System</p>
      </footer>
    </div>
  );
}

export default App;
