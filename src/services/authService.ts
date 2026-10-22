
import { UserProfile, UserRole } from '../types';

const API_BASE_URL = '/api';

interface AuthResponse {
  user?: UserProfile;
  message?: string;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Cannot connect to the RoadWatch server. Please make sure the backend is running.'
    );
  }

  const data = (await response.json().catch(() => ({}))) as AuthResponse;

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Request failed (${response.status}).`
    );
  }

  return data as T;
}

function extractUser(data: AuthResponse): UserProfile {
  const user = data.user ?? (data as unknown as UserProfile);

  if (
    !user ||
    typeof user.id !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.email !== 'string' ||
    !['citizen', 'authority', 'field_crew', 'admin'].includes(user.role)
  ) {
    throw new Error('The server returned an invalid user response.');
  }

  return user;
}

export const authService = {
  getCurrentUser(): UserProfile | null {
    return null;
  },

  async restoreSession(): Promise<UserProfile | null> {
    try {
      const data = await request<AuthResponse>('/auth/me');
      return extractUser(data);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Cannot connect to the RoadWatch server')
      ) {
        throw error;
      }

      return null;
    }
  },

  async signUp(
    name: string,
    email: string,
    password: string,
    ward?: string,
    phone?: string
  ): Promise<UserProfile> {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
        ward: ward?.trim() || undefined,
        phone: phone?.trim() || undefined,
      }),
    });

    return extractUser(data);
  },

  async signIn(email: string, password: string): Promise<UserProfile> {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });

    return extractUser(data);
  },

  async signOut(): Promise<void> {
    await request<{ message?: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  switchRole(_role: UserRole): UserProfile {
    throw new Error(
      'Role switching is disabled. Sign in using an authorized account.'
    );
  },

  setCurrentUser(_user: UserProfile): void {
    // Authentication state is managed by the backend session.
  },
};

