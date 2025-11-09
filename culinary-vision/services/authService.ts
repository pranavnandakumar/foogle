// Simple authentication service using localStorage for user sessions

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

const STORAGE_KEY = 'culinary_vision_user';
const SESSION_KEY = 'culinary_vision_session';

export const authService = {
  // Generate a simple user ID
  generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create a session token
  generateSessionToken(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  },

  // Sign up a new user
  signUp(email: string, name: string): User {
    const user: User = {
      id: this.generateUserId(),
      email: email.toLowerCase().trim(),
      name: name.trim(),
      createdAt: new Date()
    };

    // Store user in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    
    // Create session
    const sessionToken = this.generateSessionToken();
    localStorage.setItem(SESSION_KEY, sessionToken);
    
    console.log('User signed up:', user);
    return user;
  },

  // Sign in (for now, we'll just create a session if user exists)
  signIn(email: string): User | null {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      const user: User = JSON.parse(storedUser);
      // Check if email matches
      if (user.email.toLowerCase().trim() === email.toLowerCase().trim()) {
        // Create new session
        const sessionToken = this.generateSessionToken();
        localStorage.setItem(SESSION_KEY, sessionToken);
        console.log('User signed in:', user);
        return user;
      }
    }
    return null;
  },

  // Get current user
  getCurrentUser(): User | null {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    const sessionToken = localStorage.getItem(SESSION_KEY);
    
    if (storedUser && sessionToken) {
      try {
        const user: User = JSON.parse(storedUser);
        // Restore date object
        user.createdAt = new Date(user.createdAt);
        return user;
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    return null;
  },

  // Check if user is logged in
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  // Sign out
  signOut(): void {
    localStorage.removeItem(SESSION_KEY);
    // Optionally remove user data too, or keep it for "remember me" functionality
    // localStorage.removeItem(STORAGE_KEY);
    console.log('User signed out');
  },

  // Update user profile
  updateUser(updates: Partial<User>): User | null {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const updatedUser: User = {
      ...currentUser,
      ...updates
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    console.log('User updated:', updatedUser);
    return updatedUser;
  }
};

