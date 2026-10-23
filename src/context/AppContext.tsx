
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Complaint, UserProfile, UserRole } from '../types';
import { complaintService } from '../services/complaintService';
import { authService } from '../services/authService';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  switchRole: (role: UserRole) => void;
  complaints: Complaint[];
  loadingComplaints: boolean;
  refreshComplaints: () => Promise<void>;
  selectedComplaintId: string | null;
  setSelectedComplaintId: (id: string | null) => void;
  toasts: ToastState[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: number) => void;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    'RW-2025-8492',
  );
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [activeNavTab, setActiveNavTab] = useState('sign-in');

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Date.now();

      setToasts((previous) => [...previous, { id, message, type }]);

      setTimeout(() => {
        setToasts((previous) =>
          previous.filter((toast) => toast.id !== id),
        );
      }, 4500);
    },
    [],
  );

  const refreshComplaints = useCallback(async () => {
    setLoadingComplaints(true);

    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (error) {
      console.error('Failed to load complaints:', error);
      showToast('Unable to refresh reports from the server.', 'error');
    } finally {
      setLoadingComplaints(false);
    }
  }, [showToast]);

  // Restore the user's authenticated session.
  useEffect(() => {
    let cancelled = false;

    const restoreAuthentication = async () => {
      try {
        const user = await authService.restoreSession();

        if (cancelled) return;

        setCurrentUser(user);

        if (user) {
          const workspaceByRole: Record<UserRole, string> = {
            citizen: 'citizen-dashboard',
            authority: 'authority',
            field_crew: 'field-team',
            admin: 'admin',
          };

          setActiveNavTab(workspaceByRole[user.role] || 'citizen-dashboard');
        } else {
          setActiveNavTab('sign-in');
        }
      } catch (error) {
        if (cancelled) return;

        console.error('Failed to restore authentication session:', error);
        setCurrentUser(null);
        setActiveNavTab('sign-in');

        showToast(
          'Unable to restore your session. Please check the backend connection.',
          'error',
        );
      }
    };

    void restoreAuthentication();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // Reload complaints whenever the authenticated user changes.
  // This refreshes the dashboard after login and session restoration.
  useEffect(() => {
    void refreshComplaints();
  }, [refreshComplaints, currentUser?.id]);

  const switchRole = useCallback(
    async (role: UserRole) => {
      try {
        const user = await authService.demoLogin(role);

        setCurrentUser(user);

        const workspaceByRole: Record<UserRole, string> = {
          citizen: 'citizen-dashboard',
          authority: 'authority',
          field_crew: 'field-team',
          admin: 'admin',
        };

        setActiveNavTab(workspaceByRole[user.role] || 'citizen-dashboard');

        showToast(
          `Switched to demonstration ${user.role}: ${user.name}`,
          'success',
        );
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : `Unable to switch to demonstration ${role} account.`,
          'error',
        );
      }
    },
    [showToast],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((previous) =>
      previous.filter((toast) => toast.id !== id),
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        complaints,
        loadingComplaints,
        refreshComplaints,
        selectedComplaintId,
        setSelectedComplaintId,
        toasts,
        showToast,
        dismissToast,
        activeNavTab,
        setActiveNavTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }

  return context;
};
