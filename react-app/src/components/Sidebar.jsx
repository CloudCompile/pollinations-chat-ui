import React from 'react';
import './Sidebar.css';

const Sidebar = ({ chats, activeChatId, onChatSelect, onNewChat, onDeleteChat, onConfirmDeleteChat, isOpen, onClose }) => {
  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Pollinations" className="sidebar-brand-logo" />
          <div className="sidebar-brand-text">pollinations.ai</div>
        </div>
        <button className="close-sidebar-btn" onClick={onClose} title="Close sidebar">
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
              onClick={(e) => {
                e.stopPropagation();
                onConfirmDeleteChat(chat.id);
              }}
              aria-label="Delete chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
