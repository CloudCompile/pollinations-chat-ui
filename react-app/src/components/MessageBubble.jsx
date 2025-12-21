import React from 'react';
import PropTypes from 'prop-types';
import MemoizedMessageContent from './MemoizedMessageContent';
import ThinkingProcess from './ThinkingProcess';
import TypewriterEffect from './TypewriterEffect';
import MessageAttachments from './MessageAttachments';

const MessageBubble = ({ 
  message, 
  displayContent, 
  displayReasoning, 
  isThinking, 
  hasReasoning, 
  attachmentsToRender, 
  getAttachmentUrl, 
  copyToClipboard, 
  onRegenerate, 
  isGenerating,
  scrollToBottom
}) => {
  return (
    <div className={`message-bubble ${message.role} ${message.isStreaming ? 'streaming' : ''} ${message.isError ? 'error' : ''}`}>
      <MessageAttachments attachments={attachmentsToRender} getAttachmentUrl={getAttachmentUrl} />
      
      {message.imageUrl && (
        <div className={`message-image-container ${!message.imageUrl.startsWith('data:') ? 'loading' : ''}`}>
          <img
            src={message.imageUrl}
            alt={message.imagePrompt || 'Generated image'}
            className="message-image"
            loading="lazy"
          />
          {message.imagePrompt && (
            <div className="image-prompt">
              <strong>Prompt:</strong> {message.imagePrompt}
            </div>
          )}
          {message.imageModel && (
            <div className="image-model">
              <strong>Model:</strong> {message.imageModel}
            </div>
          )}
        </div>
      )}

      {message.videoUrl && (
        <div className={`message-video-container ${!message.videoUrl.startsWith('data:') ? 'loading' : ''}`}>
          <video
            src={message.videoUrl}
            className="message-video"
            controls
            loop
            muted
            playsInline
          />
          {message.videoPrompt && (
            <div className="video-prompt">
              <strong>Prompt:</strong> {message.videoPrompt}
            </div>
          )}
          {message.videoModel && (
            <div className="video-model">
              <strong>Model:</strong> {message.videoModel}
            </div>
          )}
        </div>
      )}
      
      {message.role === 'assistant' ? (
        <>
          {hasReasoning && (
            <ThinkingProcess 
              isThinking={isThinking} 
              content={displayReasoning} 
            />
          )}
          
          {message.isError ? (
            <div className="simple-error">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{message.content}</span>
            </div>
          ) : message.isStreaming ? (
            <div className="message-content streaming-content">
              <TypewriterEffect
                content={displayContent}
                isStreaming={true}
                onComplete={scrollToBottom}
              />
            </div>
          ) : (
            <div className="message-content">
              <MemoizedMessageContent content={displayContent} />
            </div>
          )}
        </>
      ) : (
        <div className="message-content">
          {message.content ?? ''}
        </div>
      )}
      
      {message.role === 'assistant' && !message.isStreaming && !message.isError && (
        <div className="message-actions">
          <button
            className="message-action-btn"
            onClick={() => copyToClipboard(displayContent || message.content || '')}
            title="Copy message"
            aria-label="Copy message to clipboard"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            <span className="action-label">Copy</span>
          </button>
          <button
            className="message-action-btn"
            onClick={() => !isGenerating && onRegenerate()}
            title="Regenerate response"
            disabled={isGenerating}
            aria-label="Regenerate response"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
            </svg>
            <span className="action-label">Regenerate</span>
          </button>
        </div>
      )}
    </div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.object.isRequired,
  displayContent: PropTypes.string,
  displayReasoning: PropTypes.string,
  isThinking: PropTypes.bool,
  hasReasoning: PropTypes.bool,
  attachmentsToRender: PropTypes.array,
  getAttachmentUrl: PropTypes.func.isRequired,
  copyToClipboard: PropTypes.func.isRequired,
  onRegenerate: PropTypes.func.isRequired,
  isGenerating: PropTypes.bool,
  scrollToBottom: PropTypes.func
};

export default MessageBubble;