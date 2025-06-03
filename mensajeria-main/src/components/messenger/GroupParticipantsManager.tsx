import React, { useState } from 'react';
import { useMessageStore } from '../../store/messageStore';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const GroupParticipantsManager: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { currentConversation, fetchConversations } = useMessageStore();
  const { user } = useAuth();
  const [newParticipant, setNewParticipant] = useState('');
  const [error, setError] = useState('');

  const handleAddParticipant = async () => {
    setError('');
    if (!conversationId || !newParticipant.trim()) return;
    try {
      // Insertar nuevo participante en la tabla conversation_participants
      const { error: insertError } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: conversationId, user_id: newParticipant });
      if (insertError) throw insertError;
      await fetchConversations();
      setNewParticipant('');
    } catch (e) {
      setError('No se pudo agregar el participante');
    }
  };

  // Para quitar participantes, lógica similar

  if (!currentConversation?.is_group) return null;

  return (
    <div className="p-4 border-t">
      <h3 className="font-semibold mb-2">Participantes del grupo</h3>
      <ul className="mb-2">
        {currentConversation.participants?.map(p => (
          <li key={p.id} className="flex items-center gap-2">
            {p.full_name} ({p.username})
            <button
              className="ml-2 text-red-500 hover:underline text-xs"
              onClick={async () => {
                try {
                  await supabase
                    .from('conversation_participants')
                    .delete()
                    .eq('conversation_id', currentConversation.id)
                    .eq('user_id', p.id);
                  await fetchConversations();
                } catch (e) {
                  setError('No se pudo quitar el participante');
                }
              }}
              aria-label={`Quitar a ${p.full_name}`}
              disabled={p.id === user?.id}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={newParticipant}
        onChange={e => setNewParticipant(e.target.value)}
        placeholder="ID de usuario a agregar"
        className="border rounded px-2 py-1 mr-2"
      />
      <button onClick={handleAddParticipant} className="bg-indigo-600 text-white px-3 py-1 rounded">Agregar</button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default GroupParticipantsManager;
