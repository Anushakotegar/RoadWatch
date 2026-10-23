
import { UserProfile, UserRole } from '../types';

const API_BASE_URL =
  'https://roadwatch-api-a8fn.onrender.com/api';

interface AuthResponse {
  success?: boolean;
  user?: UserProfile;
  message?: string;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
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
      'Cannot connect to the RoadWatch backend. Please try again.',
    );
  }

  const responseText = await response.text();

  let data: AuthResponse;

  try {
    data = responseText
      ? (JSON.parse(responseText) as AuthResponse)
      : {};
  } catch {
    throw new Error(
      'The server returned an invalid response. Please check the backend URL and deployment.',
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}.`,
    );
  }

  return data as T;
}

function extractUser(data: AuthResponse): UserProfile {
  const user = data.user;

  if (
    !user ||
    typeof user.id !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.email !== 'string' ||
    !['citizen', 'authority', 'field_crew', 'admin'].includes(
      user.role,
    )
  ) {
    throw new Error(
      'The server response did not contain a valid user account.',
    );
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
        error.message.includes('Cannot connect to the RoadWatch backend')
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
    phone?: string,
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

  async signIn(
    email: string,
    password: string,
  ): Promise<UserProfile> {
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

  async demoLogin(role: UserRole): Promise<UserProfile> {
    const data = await request<AuthResponse>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });

    return extractUser(data);
  },

  switchRole(_role: UserRole): UserProfile {
    throw new Error(
      'Role switching is disabled. Sign in using an authorized account.',
    );
  },

  setCurrentUser(_user: UserProfile): void {
    // Authentication state is managed by the backend session.
  },
};
