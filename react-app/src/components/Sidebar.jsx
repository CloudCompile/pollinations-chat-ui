import React, { useState, memo, useCallback } from 'react';
import ConfirmModal from './ConfirmModal';
import './Sidebar.css';

const Sidebar = memo(({ chats, activeChatId, onChatSelect, onNewChat, onDeleteChat, isOpen, onClose, onThemeToggle }) => {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDangerous: false
  });

  const handleDeleteChat = useCallback((chatId, e) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Chat',
      message: 'Are you sure you want to delete this chat? This action cannot be undone.',
      onConfirm: () => onDeleteChat(chatId),
      isDangerous: true
    });
  }, [onDeleteChat]);

  return (
    <>
      <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src="logo-text.svg" alt="Pollinations" className="sidebar-brand-logo" />
        </div>
        <button className={`sidebar-toggle-btn ${isOpen ? 'open' : ''}`} onClick={onClose} title="Close sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div className="sidebar-content">
        <button className="new-chat-btn" onClick={onNewChat}>
          <span>+</span>
          <span>New Chat</span>
        </button>
      </div>

      <div className="chat-list">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
            onClick={() => onChatSelect(chat.id)}
          >
            <div className="chat-item-title truncate">{chat.title}</div>
            <div className="chat-item-meta">
              {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
            </div>
            <button
              className="chat-item-delete"
              onClick={(e) => handleDeleteChat(chat.id, e)}
              aria-label="Delete chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-action-btn" onClick={onThemeToggle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
          <span>Toggle Theme</span>
        </button>
        <button className="sidebar-action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
          <span>Export Chat</span>
        </button>
        <button className="sidebar-action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
          <span>Clear All Chats</span>
        </button>
      </div>
    </aside>

    <ConfirmModal
      isOpen={confirmModal.isOpen}
      onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      onConfirm={confirmModal.onConfirm}
      title={confirmModal.title}
      message={confirmModal.message}
      confirmText="Delete"
      cancelText="Cancel"
      isDangerous={confirmModal.isDangerous}
    />
  </>
  );
});

export default Sidebar;
