import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useMessageStore, } from '../../store/messageStore';
import { useAuth } from '../../contexts/AuthContext.mensajeria';
import { Send, Image, Smile, MoreVertical, ArrowLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import GroupParticipantsManager from './GroupParticipantsManager';

const ChatArea: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Array<typeof messages[0]>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    messages, 
    currentConversation,
    fetchMessages,
    sendMessage: sendMessageStore,
    typingUsers,
    setTypingStatus
  } = useMessageStore();

  // Get other participants (excluding current user)
  const otherParticipants = currentConversation?.participants?.filter(
    p => p.id !== user?.id
  ) || [];

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setFilteredMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (search.trim()) {
      setFilteredMessages(
        messages.filter(m =>
          m.content.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredMessages(messages);
    }
  }, [search, messages]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setFilePreview(URL.createObjectURL(selectedFile));
    } else {
      setFilePreview(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !file) || !conversationId) return;
    // @ts-ignore
    await sendMessageStore(conversationId, message, file);
    setMessage('');
    setFile(null);
    setFilePreview(null);
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setTypingStatus(conversationId, user?.id || '', false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim() && conversationId) {
      setIsTyping(true);
      setTypingStatus(conversationId, user?.id || '', true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (conversationId) {
        setTypingStatus(conversationId, user?.id || '', false);
      }
    }, 3000);
  };

  // Get conversation name
  const getConversationName = () => {
    if (currentConversation?.name) return currentConversation.name;
    
    if (otherParticipants.length === 0) return 'No participants';
    if (otherParticipants.length === 1) return otherParticipants[0].full_name;
    
    return `${otherParticipants[0].full_name} and ${otherParticipants.length - 1} others`;
  };

  // Check if any user is typing
  const getTypingIndicator = () => {
    if (!conversationId) return null;
    
    const typingUserIds = typingUsers[conversationId] || [];
    // Filter out current user
    const otherTypingUserIds = typingUserIds.filter(id => id !== user?.id);
    
    if (otherTypingUserIds.length === 0) return null;
    
    // Find profiles of typing users
    const typingParticipants = currentConversation?.participants?.filter(
      p => otherTypingUserIds.includes(p.id)
    ) || [];
    
    return typingParticipants.length > 0 ? (
      <TypingIndicator users={typingParticipants} />
    ) : null;
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  let currentDate = '';
  
  messages.forEach(msg => {
    const messageDate = new Date(msg.created_at).toLocaleDateString();
    
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({
        date: messageDate,
        messages: [msg]
      });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg.sender_id !== user?.id &&
      document.visibilityState !== 'visible' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('Nuevo mensaje', {
        body: lastMsg.content || 'Archivo adjunto',
        icon: '/vite.svg'
      });
    }
  }, [messages, user]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <div className="inline-flex rounded-full bg-indigo-100 p-4 mb-4">
            <Send className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Your Messages</h3>
          <p className="text-gray-500 max-w-sm">
            Select a conversation or start a new one to begin messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en la conversación..."
          className="w-full border rounded px-2 py-1"
          aria-label="Buscar mensajes en la conversación"
        />
      </div>
      
      {/* Chat header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white">
        <button 
          className="mr-2 md:hidden text-gray-600"
          aria-label="Back to conversations"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-shrink-0">
          {otherParticipants.length === 1 && otherParticipants[0].avatar_url ? (
            <img
              src={otherParticipants[0].avatar_url}
              alt={otherParticipants[0].full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
              {getConversationName().charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="font-medium text-gray-900">{getConversationName()}</h3>
          {otherParticipants.length === 1 && otherParticipants[0].last_online && (
            <p className="text-xs text-gray-500">
              {new Date(otherParticipants[0].last_online).getTime() > Date.now() - 5 * 60 * 1000
                ? 'Online'
                : `Last seen ${formatDistanceToNow(new Date(otherParticipants[0].last_online))} ago`
              }
            </p>
          )}
        </div>
        
        <button className="text-gray-600 p-2 rounded-full hover:bg-gray-100">
          <MoreVertical size={20} />
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                    {new Date(group.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                
                {group.messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isCurrentUser={msg.sender_id === user?.id}
                    showSender={Boolean(/* aquí va la lógica original o un valor por defecto */)}
                    highlight={search}
                  />
                ))}
              </div>
            ))}
            
            {getTypingIndicator()}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <GroupParticipantsManager />
      
      {/* Message input */}
      <form 
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 bg-white p-4"
      >
        <div className="flex items-center">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-indigo-600 rounded-full"
            aria-label="Upload image"
          >
            <Image size={20} />
          </button>
          
          <div className="flex-1 mx-2 relative">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={handleInputChange}
              className="w-full py-2 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              aria-label="Escribir mensaje"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600"
              aria-label="Add emoji"
            >
              <Smile size={20} />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            aria-label="Enviar mensaje"
          >
            <Send size={20} />
          </button>
        </div>
        <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} aria-label="Adjuntar archivo" />
        {filePreview && (
          <div className="preview">
            <img src={filePreview} alt="preview" style={{ maxHeight: 80 }} />
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatArea;