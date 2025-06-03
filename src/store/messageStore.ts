import { create } from 'zustand';
import { supabase } from '../lib/supabase.mensajeria';
import { useAuthStore } from './authStore';

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
    const { data, error } = await supabase
      .from('conversations')
      .select('*, lastMessage:messages(*)')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
    } else {
      set({ conversations: data || [] });
    }
    set({ isLoadingConversations: false });
  },
  fetchMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true });
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      set({ messages: data || [] });
    }
    set({ isLoadingMessages: false });
  },
  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },
  sendMessage: async (conversationId: string, content: string, type: string = 'text') => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Usuario no autenticado');
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        type,
        read_by: [user.id],
        created_at: new Date().toISOString(),
        media_url: null
      });
    // Update local state optimistically
    const newMessage: Message = {
      id: '',
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      media_url: null,
      read_by: [],
      type,
      sender: null,
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },
  markAsRead: async (conversationId: string, messageId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    await supabase
      .from('messages')
      .update({ read_by: [user.id] })
      .eq('id', messageId);
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, read_by: [user.id] } : msg
      ),
    }));
  },
  createConversation: async (participantIds: string[], groupName?: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          is_group: participantIds.length > 2,
          name: groupName || null,
          participants: participantIds,
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Unable to create conversation');
    }

    return data.id;
  },
  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
  },
  setTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => {
    set((state) => {
      const typingUsers = { ...state.typingUsers };
      if (isTyping) {
        if (!typingUsers[conversationId]) {
          typingUsers[conversationId] = [];
        }
        if (!typingUsers[conversationId]!.includes(userId)) {
          typingUsers[conversationId]!.push(userId);
        }
      } else {
        typingUsers[conversationId] = typingUsers[conversationId]?.filter((id) => id !== userId) || [];
      }
      return { typingUsers };
    });
  },
}));
