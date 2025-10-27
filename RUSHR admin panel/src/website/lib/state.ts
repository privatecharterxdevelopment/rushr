// Placeholder state management for website
import { useState, useEffect } from 'react';

interface User {
  signedIn: boolean;
  name?: string;
  role?: 'HOMEOWNER' | 'CONTRACTOR' | null;
}

interface Message {
  id: string;
  from: string;
  body: string;
}

interface AppState {
  user: User;
  messages: Message[];
}

const initialState: AppState = {
  user: {
    signedIn: false,
    name: undefined,
    role: null,
  },
  messages: [],
};

export const useApp = () => {
  const [state, setState] = useState<AppState>(initialState);
  const [unreadCount, setUnreadCount] = useState(0);

  const signOut = () => {
    setState(initialState);
    setUnreadCount(0);
  };

  const markMessagesRead = (count: number) => {
    setUnreadCount(Math.max(0, unreadCount - count));
  };

  const openAuth = () => {
    // Placeholder for opening auth modal
    console.log('Opening auth modal');
  };

  const addToast = (message: string) => {
    // Placeholder for toast notifications
    console.log('Toast:', message);
  };

  return {
    state,
    signOut,
    unreadCount,
    markMessagesRead,
    openAuth,
    addToast,
  };
};