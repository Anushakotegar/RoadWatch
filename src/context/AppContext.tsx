
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
  const [loadingComplaints, setLoadingComplaints] = useState<boolean>(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    'RW-2025-8492'
  );
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [activeNavTab, setActiveNavTab] = useState<string>('sign-in');

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Date.now();
      setToasts((previous) => [...previous, { id, message, type }]);

      setTimeout(() => {
        setToasts((previous) => previous.filter((toast) => toast.id !== id));
      }, 4500);
    },
    []
  );

  const refreshComplaints = useCallback(async () => {
    setLoadingComplaints(true);

    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (error) {
      console.error('Failed to load complaints:', error);
    } finally {
      setLoadingComplaints(false);
    }
  }, []);

  // Restore the authenticated user from the backend session on page load.
  useEffect(() => {
    let cancelled = false;

    const restoreAuthentication = async () => {
      try {
        const user = await authService.restoreSession();

        if (cancelled) return;

        setCurrentUser(user);

        if (user) {
          if (user.role === 'citizen') {
            setActiveNavTab('citizen-dashboard');
          } else if (user.role === 'authority') {
            setActiveNavTab('authority');
          } else if (user.role === 'field_crew') {
            setActiveNavTab('field-team');
          } else if (user.role === 'admin') {
            setActiveNavTab('admin');
          }
        } else {
          setActiveNavTab('sign-in');
        }
      } catch (error) {
        if (cancelled) return;

        console.error('Failed to restore authentication session:', error);
        setCurrentUser(null);
        setActiveNavTab('sign-in');
        showToast(
          'Unable to connect to the authentication server. Please check that the backend is running.',
          'error'
        );
      }
    };

    void restoreAuthentication();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // Load public complaint data.
  useEffect(() => {
    void refreshComplaints();
  }, [refreshComplaints]);

  // Privileged roles cannot be selected by changing the frontend view.
  const switchRole = useCallback(
    (role: UserRole) => {
      showToast(
        `Switching to ${role} is disabled. Sign in with an authorized account instead.`,
        'error'
      );
    },
    [showToast]
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
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
