import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Conversation, useMessageStore } from '../../store/messageStore';
import { Search, Plus, MessageSquare } from 'lucide-react';
import ConversationItem from './ConversationItem';
import NewConversationModal from './NewConversationModal';
import { useAuth } from '../../contexts/AuthContext';

const ConversationList: React.FC = () => {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    conversations, 
    fetchConversations, 
    isLoadingConversations,
    activeConversationId,
    setActiveConversation
  } = useMessageStore();

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, setActiveConversation]);

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm.trim()) return true;
    
    // Search in conversation name (for groups)
    if (conversation.name && conversation.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return true;
    }
    
    // Search in participant names
    return conversation.participants?.some(participant => 
      participant.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleConversationSelect = (conversation: Conversation) => {
    navigate(`/messenger/${conversation.id}`);
  };

  const handleCreateConversation = (newConversationId: string) => {
    setShowNewConversationModal(false);
    navigate(`/messenger/${newConversationId}`);
  };

  // Get conversation display name
  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    const otherParticipants = conversation.participants?.filter(
      p => p.id !== user?.id
    ) || [];
    
    if (otherParticipants.length === 0) return 'No participants';
    if (otherParticipants.length === 1) return otherParticipants[0].full_name;
    
    return `${otherParticipants[0].full_name} and ${otherParticipants.length - 1} others`;
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white w-full md:w-80 lg:w-96">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <MessageSquare className="mb-2" size={24} />
            <p className="text-center">
              {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowNewConversationModal(true)}
                className="mt-2 text-indigo-600 hover:text-indigo-800"
              >
                Start a new conversation
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              onClick={() => handleConversationSelect(conversation)}
              displayName={getConversationName(conversation)}
            />
          ))
        )}
      </div>

      <button
        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full mb-2"
        onClick={() => setShowNewConversationModal(true)}
        aria-label="Nueva conversación o grupo"
      >
        <Plus size={18} /> Nueva conversación / grupo
      </button>
      {showNewConversationModal && (
        <NewConversationModal
          onClose={() => setShowNewConversationModal(false)}
          onConversationCreated={handleCreateConversation}
        />
      )}
    </div>
  );
};

export default ConversationList;