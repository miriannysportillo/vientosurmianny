import React from 'react';
import { format } from 'date-fns';
import { Message } from '../../store/messageStore';
import { Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showSender: boolean;
  highlight?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  showSender = false,
  highlight
}) => {
  const { user } = useAuth();
  
  // Format timestamp
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  // Get read status
  const getReadStatus = () => {
    if (!isCurrentUser) return null;
    
    const isRead = message.read_by.some(id => id !== user?.id);
    
    return isRead ? (
      <CheckCheck size={14} className="text-indigo-500" />
    ) : (
      <Check size={14} className="text-gray-400" />
    );
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[75%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        {showSender && !isCurrentUser && message.sender && (
          <div className="text-xs text-gray-500 mb-1 ml-2">
            {message.sender.username}
          </div>
        )}
        
        <div className="flex items-end">
          {!isCurrentUser && message.sender && !message.sender.avatar_url && (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-2 flex-shrink-0">
              {message.sender.username.charAt(0).toUpperCase()}
            </div>
          )}
          
          {!isCurrentUser && message.sender && message.sender.avatar_url && (
            <img
              src={message.sender.avatar_url}
              alt={message.sender.username}
              className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
            />
          )}
          
          <div
            className={`rounded-2xl px-4 py-2 break-words ${
              isCurrentUser
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
            }`}
          >
            <div className="text-sm">
              {highlightText(message.content, highlight || '')}
            </div>
            <div className={`text-xs mt-1 flex items-center ${isCurrentUser ? 'text-indigo-100' : 'text-gray-500'}`}>
              {formatTime(message.created_at)}
              {isCurrentUser && (
                <span className="ml-1">{getReadStatus()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;