import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  activeWorkspaceId: string | null;
}

interface Workspace {
  _id: string;
  name: string;
  slug: string;
  organizationId: string;
}

interface AuthContextType {
  user: User | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndWorkspaces = async () => {
    try {
      const profile = await api.get<User>('/auth/me');
      setUser(profile);

      const list = await api.get<Workspace[]>('/workspaces');
      setWorkspaces(list);

      const activeId = profile.activeWorkspaceId || (list.length > 0 ? list[0]._id : null);
      if (activeId) {
        localStorage.setItem('pms_active_workspace_id', activeId);
        const active = list.find((w) => w._id === activeId) || null;
        setActiveWorkspace(active);
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('pms_access_token');
    if (token) {
      fetchProfileAndWorkspaces();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/signin', { email, password });
      localStorage.setItem('pms_access_token', res.accessToken);
      localStorage.setItem('pms_refresh_token', res.refreshToken);
      if (res.user.activeWorkspaceId) {
        localStorage.setItem('pms_active_workspace_id', res.user.activeWorkspaceId);
      }
      await fetchProfileAndWorkspaces();
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/signup', { name, email, password });
      localStorage.setItem('pms_access_token', res.accessToken);
      localStorage.setItem('pms_refresh_token', res.refreshToken);
      if (res.user.activeWorkspaceId) {
        localStorage.setItem('pms_active_workspace_id', res.user.activeWorkspaceId);
      }
      await fetchProfileAndWorkspaces();
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('pms_access_token');
    localStorage.removeItem('pms_refresh_token');
    localStorage.removeItem('pms_active_workspace_id');
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
    setLoading(false);
  };

  const switchWorkspace = async (workspaceId: string) => {
    try {
      await api.post(`/auth/workspace/${workspaceId}`);
      localStorage.setItem('pms_active_workspace_id', workspaceId);
      const active = workspaces.find((w) => w._id === workspaceId) || null;
      setActiveWorkspace(active);
      if (user) {
        setUser({ ...user, activeWorkspaceId: workspaceId });
      }
    } catch (err) {
      console.error('Failed to switch workspace', err);
    }
  };

  const refreshWorkspaces = async () => {
    try {
      const list = await api.get<Workspace[]>('/workspaces');
      setWorkspaces(list);
      const activeId = localStorage.getItem('pms_active_workspace_id');
      if (activeId) {
        const active = list.find((w) => w._id === activeId) || null;
        setActiveWorkspace(active);
      }
    } catch (err) {
      console.error('Failed to refresh workspaces', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        activeWorkspace,
        loading,
        signIn,
        signUp,
        logout,
        switchWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
