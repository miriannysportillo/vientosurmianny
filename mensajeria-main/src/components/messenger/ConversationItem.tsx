import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Conversation, useMessageStore } from '../../store/messageStore';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, Users } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  displayName: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  displayName
}) => {
  const { user } = useAuth();
  
  // Get avatar for one-on-one conversations
  const getAvatar = () => {
    if (conversation.is_group) return null;
    
    const otherParticipant = conversation.participants?.find(
      p => p.id !== user?.id
    );
    
    return otherParticipant?.avatar_url;
  };

  // Format the last message preview
  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const isSender = conversation.lastMessage.sender_id === user?.id;
    const prefix = isSender ? 'You: ' : '';
    
    let content = conversation.lastMessage.content;
    if (content.length > 30) {
      content = content.substring(0, 27) + '...';
    }
    
    return prefix + content;
  };

  // Format the timestamp
  const getFormattedTime = () => {
    if (!conversation.lastMessage) return '';
    
    try {
      return formatDistanceToNow(new Date(conversation.lastMessage.created_at), { 
        addSuffix: true,
        includeSeconds: true
      });
    } catch (error) {
      return '';
    }
  };

  // Check if there are unread messages
  const hasUnread = (conversation.unreadCount || 0) > 0;

  const avatar = getAvatar();

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-colors ${
        isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
            {conversation.is_group ? (
              <Users size={20} />
            ) : (
              <MessageCircle size={20} />
            )}
          </div>
        )}
        
        {/* Online indicator - show for one-on-one conversations */}
        {!conversation.is_group && conversation.participants?.some(p => 
          p.id !== user?.id && 
          p.last_online && 
          new Date(p.last_online).getTime() > Date.now() - 5 * 60 * 1000
        ) && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className={`font-medium truncate ${hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
            {displayName}
          </h3>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-1">
            {getFormattedTime()}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {getLastMessagePreview()}
          </p>
          
          {hasUnread && (
            <div className="ml-2 bg-indigo-600 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;