// Copiado y adaptado desde mensajeria-main/src/components/messenger/ConversationItem.tsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Conversation, useMessageStore } from '../../store/messageStore';
import { useAuthStore } from '../../store/authStore';
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
  const user = useAuthStore.getState().user;

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

  return (
    <div onClick={onClick} className={`p-4 flex items-center cursor-pointer ${isActive ? 'bg-indigo-50' : ''}`}>
      <div className="mr-3">
        {getAvatar() ? (
          <img src={getAvatar()!} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
        ) : conversation.is_group ? (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
            <Users size={20} />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
            <MessageCircle size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900 truncate">{conversation.name || displayName}</span>
          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{getFormattedTime()}</span>
        </div>
        <div className="text-sm text-gray-500 truncate">{getLastMessagePreview()}</div>
      </div>
      {conversation.unreadCount ? (
        <span className="ml-2 bg-indigo-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold">
          {conversation.unreadCount}
        </span>
      ) : null}
    </div>
  );
};

export default ConversationItem;
