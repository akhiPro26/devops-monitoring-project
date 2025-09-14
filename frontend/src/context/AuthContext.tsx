"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { User, LoginData, RegisterData } from "../types"
import { usersApi } from "../lib/api"

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true, error: null }
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      }
    case "LOGIN_FAILURE":
      return { ...state, isLoading: false, error: action.payload }
    case "LOGOUT":
      return { ...initialState }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Check for existing token on app start
    const token = localStorage.getItem("auth_token")
    const userStr = localStorage.getItem("user")

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } })
      } catch (error) {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user")
      }
    }
  }, [])

  const login = async (data: LoginData) => {
    dispatch({ type: "LOGIN_START" })
    try {
      const response = await usersApi.post("/auth/login", data)
      const { user, token } = response.data

      localStorage.setItem("auth_token", token)
      localStorage.setItem("user", JSON.stringify(user))

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } })
    } catch (error: any) {
      const message = error.response?.data?.error || "Login failed"
      dispatch({ type: "LOGIN_FAILURE", payload: message })
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    dispatch({ type: "LOGIN_START" })
    try {
      const response = await usersApi.post("/auth/register", data)
      const { user, token } = response.data

      localStorage.setItem("auth_token", token)
      localStorage.setItem("user", JSON.stringify(user))

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } })
    } catch (error: any) {
      const message = error.response?.data?.error || "Registration failed"
      dispatch({ type: "LOGIN_FAILURE", payload: message })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user")
    dispatch({ type: "LOGOUT" })
  }

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
