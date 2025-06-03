import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  last_online: string | null;
};

export type Conversation = {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_id: string | null;
  is_group: boolean;
  name: string | null;
  participants?: Profile[];
  lastMessage?: Message | null;
  unreadCount?: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  media_url: string | null;
  read_by: string[];
  type: string;
  sender?: Profile | null;
};

interface MessageState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  profiles: Record<string, Profile>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  activeConversationId: string | null;
  typingUsers: Record<string, string[]>;
  
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  sendMessage: (conversationId: string, content: string, type?: string) => Promise<void>;
  markAsRead: (conversationId: string, messageId: string) => Promise<void>;
  createConversation: (participantIds: string[], groupName?: string) => Promise<string>;
  setActiveConversation: (conversationId: string | null) => void;
  setTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  profiles: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  activeConversationId: null,
  typingUsers: {},

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data?.user?.id;
      if (!userId) throw new Error('No autenticado');
      // Get all conversations the user is a part of
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (participantError) {
        throw participantError;
      }

      if (!participantData.length) {
        set({ conversations: [], isLoadingConversations: false });
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      // Fetch the conversations
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        throw conversationsError;
      }

      // For each conversation, get the participants
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          // Get participants
          const { data: participants, error: participantsError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversation.id);

          if (participantsError) {
            throw participantsError;
          }

          // Get profiles of participants
          const participantProfiles = await Promise.all(
            participants.map(async (p) => {
              const profile = await get().fetchProfile(p.user_id);
              return profile;
            })
          );

          // Get last message
          let lastMessage = null;
          if (conversation.last_message_id) {
            const { data: messageData, error: messageError } = await supabase
              .from('messages')
              .select('*')
              .eq('id', conversation.last_message_id)
              .single();

            if (!messageError && messageData) {
              const sender = await get().fetchProfile(messageData.sender_id);
              lastMessage = { ...messageData, sender };
            }
          }

          // Get unread count
          const { data: unreadData, error: unreadError } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversation.id)
            .not('read_by', 'cs', `{${userId}}`);

          const unreadCount = unreadError ? 0 : unreadData.length;

          return {
            ...conversation,
            participants: participantProfiles.filter(Boolean) as Profile[],
            lastMessage,
            unreadCount
          };
        })
      );

      set({ conversations: conversationsWithDetails, isLoadingConversations: false });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      set({ isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true, activeConversationId: conversationId });
    try {
      // Get the conversation details
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (conversationError) {
        throw conversationError;
      }

      // Get participants
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId);

      if (participantsError) {
        throw participantsError;
      }

      // Get profiles of participants
      const participantProfiles = await Promise.all(
        participants.map(async (p) => {
          const profile = await get().fetchProfile(p.user_id);
          return profile;
        })
      );

      const currentConversation = {
        ...conversation,
        participants: participantProfiles.filter(Boolean) as Profile[]
      };

      // Get messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      // Add sender details to each message
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await get().fetchProfile(message.sender_id);
          return { ...message, sender };
        })
      );

      // Subscribe to new messages in this conversation
      supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            const newMessage = payload.new as Message;
            const sender = await get().fetchProfile(newMessage.sender_id);
            
            set(state => ({
              messages: [...state.messages, { ...newMessage, sender }]
            }));

            // Auto-mark messages as read if this is the active conversation
            if (get().activeConversationId === conversationId) {
              get().markAsRead(conversationId, newMessage.id);
            }
          }
        )
        .subscribe();

      // Mark messages as read
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data?.user?.id;
      if (userId) {
        const unreadMessages = messages.filter(m => 
          !m.read_by.includes(userId) && 
          m.sender_id !== userId
        );
        if (unreadMessages.length > 0) {
          const lastMessage = unreadMessages[unreadMessages.length - 1];
          get().markAsRead(conversationId, lastMessage.id);
        }
      }

      set({ 
        messages: messagesWithSenders, 
        currentConversation, 
        isLoadingMessages: false 
      });

      // Update conversations list to reflect read status
      get().fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ isLoadingMessages: false });
    }
  },

  fetchProfile: async (userId: string) => {
    // Check if we already have this profile
    if (get().profiles[userId]) {
      return get().profiles[userId];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      // Update profiles cache
      set(state => ({
        profiles: { ...state.profiles, [userId]: data }
      }));

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  sendMessage: async (conversationId: string, content: string, file?: File) => {
    let mediaUrl: string | null = null;
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const uploadResult = await supabase.storage.from('chat-media').upload(fileName, file);
      if (uploadResult.error) throw uploadResult.error;
      if (uploadResult.data && uploadResult.data.path) {
        const publicUrlResult = supabase.storage.from('chat-media').getPublicUrl(uploadResult.data.path);
        mediaUrl = publicUrlResult.data?.publicUrl || null;
      }
    }
    const userResponse = await supabase.auth.getUser();
    const userId = userResponse.data?.user?.id;
    if (!userId) throw new Error('No autenticado');
    await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        sender_id: userId,
        content,
        media_url: mediaUrl,
        type: file ? 'media' : 'text',
      }
    ]);
  },

  markAsRead: async (conversationId: string, messageId: string) => {
    const userResponse = await supabase.auth.getUser();
    const userId = userResponse.data?.user?.id;
    if (!userId) return;
    try {
      // Update the last read message in conversation participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .update({ last_read_message_id: messageId })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      if (participantError) {
        throw participantError;
      }
      // Get all unread messages up to this one
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .not('read_by', 'cs', `{${userId}}`)
        .lte('created_at', (await supabase
          .from('messages')
          .select('created_at')
          .eq('id', messageId)
          .single()).data?.created_at);
      if (messagesError) {
        throw messagesError;
      }
      // Update each message's read_by array
      for (const message of messages) {
        if (!message.read_by.includes(userId)) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({
              read_by: [...message.read_by, userId]
            })
            .eq('id', message.id);
          if (updateError) {
            console.error('Error updating message read status:', updateError);
          }
        }
      }
      set(state => ({
        messages: state.messages.map(message => {
          if (
            message.conversation_id === conversationId &&
            !message.read_by.includes(userId)
          ) {
            return {
              ...message,
              read_by: [...message.read_by, userId]
            };
          }
          return message;
        })
      }));
      get().fetchConversations();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  },

  createConversation: async (participantIds: string[], groupName?: string) => {
    const userResponse = await supabase.auth.getUser();
    const currentUserId = userResponse.data?.user?.id;
    if (!currentUserId) throw new Error("Not authenticated");
    if (!participantIds.includes(currentUserId)) {
      participantIds.push(currentUserId);
    }
    const isGroup = participantIds.length > 2 || (groupName && groupName.trim().length > 0);
    try {
      if (!isGroup) {
        // ...lógica existente para 1 a 1...
      }
      // Crear nueva conversación (grupo o 1 a 1 forzado por nombre)
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert([
          {
            is_group: Boolean(isGroup),
            name: isGroup ? (groupName && groupName.trim().length > 0 ? groupName : 'Nuevo grupo') : null
          }
        ])
        .select()
        .single();
      if (conversationError) throw conversationError;
      const participantInserts = participantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId
      }));
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participantInserts);
      if (participantError) throw participantError;
      get().fetchConversations();
      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
  },

  setTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => {
    set(state => {
      const typingUsers = { ...state.typingUsers };
      if (isTyping) {
        if (!typingUsers[conversationId]) {
          typingUsers[conversationId] = [];
        }
        if (!typingUsers[conversationId].includes(userId)) {
          typingUsers[conversationId].push(userId);
        }
      } else {
        if (typingUsers[conversationId]) {
          typingUsers[conversationId] = typingUsers[conversationId].filter(id => id !== userId);
        }
      }
      return { typingUsers };
    });
  },
}));