import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  workspaceId: string;
}

interface TypingIndicator {
  taskId: string;
  userId: string;
  name: string;
  isTyping: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: OnlineUser[];
  typingUsers: Record<string, string>; // userId -> name if typing
  taskUpdates: { taskId: string; action: string; metadata: any } | null;
  joinWorkspace: (workspaceId: string) => void;
  joinTask: (taskId: string) => void;
  leaveTask: (taskId: string) => void;
  sendTyping: (taskId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeWorkspace } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [taskUpdates, setTaskUpdates] = useState<{ taskId: string; action: string; metadata: any } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('pms_access_token');
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to backend');
      if (activeWorkspace) {
        newSocket.emit('joinWorkspace', {
          workspaceId: activeWorkspace._id,
          name: user.name,
          avatar: user.avatar || '',
        });
      }
    });

    newSocket.on('presence', (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('typingStatus', (status: TypingIndicator) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (status.isTyping) {
          next[status.userId] = status.name;
        } else {
          delete next[status.userId];
        }
        return next;
      });
    });

    newSocket.on('taskUpdated', (update) => {
      setTaskUpdates(update);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from backend');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Sync workspace room on active workspace switch
  useEffect(() => {
    if (socket && user && activeWorkspace) {
      socket.emit('joinWorkspace', {
        workspaceId: activeWorkspace._id,
        name: user.name,
        avatar: user.avatar || '',
      });
      // Clear workspace-specific typing users
      setTypingUsers({});
    }
  }, [activeWorkspace, socket]);

  const joinWorkspace = (workspaceId: string) => {
    if (socket && user) {
      socket.emit('joinWorkspace', {
        workspaceId,
        name: user.name,
        avatar: user.avatar || '',
      });
    }
  };

  const joinTask = (taskId: string) => {
    if (socket) {
      socket.emit('joinTask', { taskId });
      // Reset typing indicators for new task
      setTypingUsers({});
    }
  };

  const leaveTask = (taskId: string) => {
    if (socket) {
      socket.emit('leaveTask', { taskId });
    }
  };

  const sendTyping = (taskId: string, isTyping: boolean) => {
    if (socket && user) {
      socket.emit('typing', {
        taskId,
        userId: user.userId,
        name: user.name,
        isTyping,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        typingUsers,
        taskUpdates,
        joinWorkspace,
        joinTask,
        leaveTask,
        sendTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
