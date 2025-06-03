import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useMessageStore, Profile } from '../../store/messageStore';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NewConversationModalProps {
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  onClose,
  onConversationCreated
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState('');
  const { createConversation } = useMessageStore();

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, username, full_name, avatar_url')
          .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
          .neq('id', user?.id || '')
          .limit(10);

        if (error) {
          throw error;
        }

        setUsers(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, user?.id]);

  const handleUserSelect = (profile: Profile) => {
    // Check if user is already selected
    if (selectedUsers.some(u => u.id === profile.id)) {
      // Remove from selection
      setSelectedUsers(selectedUsers.filter(u => u.id !== profile.id));
    } else {
      // Add to selection
      setSelectedUsers([...selectedUsers, profile]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;
    const participantIds = selectedUsers.map(u => u.id);
    // Si hay más de un usuario seleccionado, es grupo
    const conversationId = await createConversation(participantIds, groupName);
    onConversationCreated(conversationId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 p-1"><X /></button>
        <h2 className="text-lg font-semibold mb-4">Nueva conversación</h2>
        <input
          type="text"
          placeholder="Nombre del grupo (opcional)"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          className="w-full border rounded px-2 py-1 mb-2"
          aria-label="Nombre del grupo"
        />

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar personas por nombre o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
              autoFocus
              aria-label="Buscar personas"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={20} />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
                aria-label="Limpiar búsqueda"
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Selected users chips */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedUsers.map(user => (
              <div
                key={user.id}
                className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center"
              >
                <span className="text-sm font-medium">{user.username}</span>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="ml-1 text-indigo-600 hover:text-indigo-800"
                  aria-label={`Remove ${user.username}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search results */}
        <div className="max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : users.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {users.map(profile => (
                <li
                  key={profile.id}
                  className={`py-2 cursor-pointer flex items-center px-2 rounded transition hover:bg-indigo-50 ${selectedUsers.some(u => u.id === profile.id) ? 'bg-indigo-100' : ''}`}
                  onClick={() => handleUserSelect(profile)}
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 flex-shrink-0 shadow">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-full h-full rounded-full object-cover border-2 border-indigo-200"
                      />
                    ) : (
                      <span className="font-bold text-lg">{profile.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{profile.full_name}</p>
                    <p className="text-xs text-gray-500">@{profile.username}</p>
                  </div>
                  {selectedUsers.some(u => u.id === profile.id) && (
                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs ml-2 shadow">
                      ✓
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : searchTerm.length >= 2 ? (
            <p className="text-gray-500 text-center py-4">No se encontraron usuarios</p>
          ) : null}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 mr-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateConversation}
            className="w-full bg-indigo-600 text-white py-2 rounded mt-4 disabled:opacity-50"
            disabled={selectedUsers.length === 0}
          >
            Crear conversación
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;