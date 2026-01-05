import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/api";

type UserRole = "patient" | "front-desk" | "doctor";

interface User {
  id: string;
  email: string;
  firstName: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export type { UserRole };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("neuroassist_token");
      if (token) {
        try {
          const userData = await apiRequest("/auth/me");
          // Backend User model has 'role' as UserRole enum (uppercase)
          // Frontend expects lowercase
          const profile = await apiRequest("/users/me/profile"); // We might need to fetch profile for first_name

          setUser({
            id: userData.id,
            email: userData.email,
            firstName: profile.first_name || userData.email.split('@')[0],
            role: userData.role.toLowerCase() as UserRole,
          });
        } catch (error) {
          console.error("Failed to load user", error);
          localStorage.removeItem("neuroassist_token");
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    // OAuth2PasswordRequestForm expects x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const data = await apiRequest("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    localStorage.setItem("neuroassist_token", data.access_token);

    // Fetch user details
    const userData = await apiRequest("/auth/me");
    const profile = await apiRequest("/users/me/profile");

    const newUser: User = {
      id: userData.id,
      email: userData.email,
      firstName: profile.first_name || userData.email.split('@')[0],
      role: userData.role.toLowerCase() as UserRole,
    };

    setUser(newUser);
  };

  const signUp = async (formData: any) => {
    const [firstName, ...lastNames] = formData.fullName.split(" ");
    const lastName = lastNames.join(" ") || " ";

    // Map roles like 'front-desk' to 'FRONT_DESK'
    const backendRole = formData.role.replace('-', '_').toUpperCase();

    await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        role: backendRole,
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone,
        age: parseInt(formData.age),
        gender: formData.gender,
      }),
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("neuroassist_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signUp,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
