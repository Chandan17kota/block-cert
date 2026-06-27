"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import { authApi, getErrorMessage } from "./auth-api"
import { sessionManager, userManager } from "./auth-utils"
import {
  AuthState,
  User,
  SigninFormData,
  SignupFormData,
  GoogleAuthData,
  AuthResponse
} from "./auth-types"

interface AuthContextType extends AuthState {
  signin: (data: SigninFormData) => Promise<AuthResponse>
  signup: (data: SignupFormData) => Promise<AuthResponse>
  googleAuth: (data: GoogleAuthData) => Promise<AuthResponse>
  signout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  clearError: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status: sessionStatus } = useSession()

  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false
  })
  const [error, setError] = useState<string | null>(null)

  // Keep AuthContext in sync for Google/NextAuth logins.
  // (Email/JWT logins are already handled via userManager + refreshSession.)
  useEffect(() => {
    if (sessionStatus === "loading") return

    if (sessionStatus !== "authenticated" || !session?.user) {
      return
    }

    const sessionUser = session.user as any
    const nextAuthUser: User = {
      id: sessionUser.id,
      email: sessionUser.email ?? "",
      username: sessionUser.username ?? sessionUser.name ?? (sessionUser.email ? String(sessionUser.email).split("@")[0] : ""),
      fullName: sessionUser.name ?? null,
      usertype: sessionUser.usertype ?? null,
      institutionname: sessionUser.institutionname ?? null,
      admin: sessionUser.admin ?? false,
    }

    // Avoid clobbering an already-populated user (e.g. JWT login) unless usertype is missing.
    setState(prev => {
      if (prev.user?.usertype) {
        return { ...prev, isLoading: false, isAuthenticated: true }
      }

      return {
        ...prev,
        user: nextAuthUser,
        token: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: true,
      }
    })

    // Cache for UI (used by sidebar/layouts) similar to JWT flows.
    userManager.setUser(nextAuthUser)
  }, [sessionStatus, session])

  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check if user data exists in client-accessible cookie
        const user = userManager.getUser()

        // Note: We can't check token validity client-side anymore since tokens are HttpOnly
        // The server will validate the HttpOnly cookie on API requests
        if (user && user.usertype) {
          setState({
            user,
            token: null, // Token is in HttpOnly cookie
            refreshToken: null, // Refresh token is in HttpOnly cookie
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          // Attempt to refresh session from server (in case HttpOnly cookies exist but local storage is empty or invalid)
          refreshSession().then(success => {
            if (!success) {
              setState({
                user: null,
                token: null,
                refreshToken: null,
                isLoading: false,
                isAuthenticated: false
              })
            }
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        userManager.removeUser()
        setState({
          user: null,
          token: null,
          refreshToken: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    }

    initializeAuth()
  }, [])

  const signin = async (data: SigninFormData): Promise<AuthResponse> => {
    setError(null)
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await authApi.signin(data)

      // Note: Cookies are automatically set by the server via Set-Cookie header
      // We only need to update the client state with user info
      // The tokens are now in HttpOnly cookies and not accessible to JavaScript

      setState({
        user: {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          usertype: response.user.usertype,
          institutionname: response.user.institutionname,
          admin: response.user.admin
        },
        token: null, // Token is now in HttpOnly cookie
        refreshToken: null, // Refresh token is now in HttpOnly cookie
        isLoading: false,
        isAuthenticated: true
      })

      // Still save user data to client-accessible cookie for UI purposes
      userManager.setUser({
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        usertype: response.user.usertype,
        institutionname: response.user.institutionname,
        admin: response.user.admin
      })

      return response
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signup = async (data: SignupFormData): Promise<AuthResponse> => {
    setError(null)
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await authApi.signup(data)

      // Note: Cookies are automatically set by the server via Set-Cookie header
      // We only need to update the client state with user info

      setState({
        user: {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          usertype: response.user.usertype,
          institutionname: response.user.institutionname,
          admin: response.user.admin
        },
        token: null, // Token is now in HttpOnly cookie
        refreshToken: null, // Refresh token is now in HttpOnly cookie
        isLoading: false,
        isAuthenticated: true
      })

      // Still save user data to client-accessible cookie for UI purposes
      userManager.setUser({
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        usertype: response.user.usertype,
        institutionname: response.user.institutionname,
        admin: response.user.admin
      })

      return response
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const googleAuth = async (data: GoogleAuthData): Promise<AuthResponse> => {
    setError(null)
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await authApi.googleAuth(data)

      // Note: Cookies are automatically set by the server via Set-Cookie header
      // We only need to update the client state with user info

      setState({
        user: {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          usertype: response.user.usertype,
          institutionname: response.user.institutionname,
          admin: response.user.admin
        },
        token: null, // Token is now in HttpOnly cookie
        refreshToken: null, // Refresh token is now in HttpOnly cookie
        isLoading: false,
        isAuthenticated: true
      })

      // Still save user data to client-accessible cookie for UI purposes
      userManager.setUser({
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        usertype: response.user.usertype,
        institutionname: response.user.institutionname,
        admin: response.user.admin
      })

      return response
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signout = async () => {
    try {
      // Call logout endpoint to clear HttpOnly cookies on server
      await fetch("/api/auth/logout", {
        method: 'POST',
        headers: { "Content-Type": "application/json" }
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
      // Continue with client-side cleanup even if server call fails
    }

    // Clear NextAuth session
    await nextAuthSignOut({ redirect: false })

    // Clear local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("usertype");
      localStorage.removeItem("isAdmin");
    }

    // Clear client-side user data
    userManager.removeUser()
    setState({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false
    })
    setError(null)
  }


  const refreshSession = async (): Promise<boolean> => {
    try {
      // With HttpOnly cookies, we can't validate tokens client-side
      // We need to make a request to the server to check if the session is still valid
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      // Use relative path if no env var, which works for same-origin (standard Next.js app)
      const url = baseUrl ? `${baseUrl}/users/me` : "/api/users/me";

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include' // Include cookies in request
      })

      if (response.ok) {
        const data = await response.json();
        // Endpoint /api/users/me returns { user: ... }
        const user = data.user;

        setState(prev => ({
          ...prev,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            usertype: user.usertype,
            institutionname: user.institutionname,
            admin: user.admin
          },
          isLoading: false,
          isAuthenticated: true
        }));

        userManager.setUser(user);
        return true
      } else if (response.status === 401) {
        // Token expired or invalid
        await signout()
        return false
      } else {
        return false
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      await signout()
      return false
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value: AuthContextType = {
    ...state,
    signin,
    signup,
    googleAuth,
    signout,
    refreshSession,
    clearError,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const useAuthForm = () => {
  const { signin, signup, googleAuth, isLoading, error, clearError } = useAuth()

  return {
    signin,
    signup,
    googleAuth,
    isLoading,
    error,
    clearError
  }
}

export const useAuthState = () => {
  const { user, token, isAuthenticated, isLoading } = useAuth()

  return {
    user,
    token,
    isAuthenticated,
    isLoading
  }
}

export const useAuthActions = () => {
  const { signout, refreshSession, clearError } = useAuth()

  return {
    signout,
    refreshSession,
    clearError
  }
}