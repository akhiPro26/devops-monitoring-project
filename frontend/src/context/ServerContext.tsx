"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Server } from "../types"
import { monitoringApi } from "../lib/api"

interface ServerState {
  servers: Server[]
  isLoading: boolean
  error: string | null
}

type ServerAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Server[] }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "ADD_SERVER"; payload: Server }
  | { type: "UPDATE_SERVER"; payload: Server }
  | { type: "DELETE_SERVER"; payload: string }
  | { type: "CLEAR_ERROR" }

const initialState: ServerState = {
  servers: [],
  isLoading: false,
  error: null,
}

const serverReducer = (state: ServerState, action: ServerAction): ServerState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null }
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, servers: action.payload, error: null }
    case "FETCH_FAILURE":
      return { ...state, isLoading: false, error: action.payload }
    case "ADD_SERVER":
      return { ...state, servers: [...state.servers, action.payload] }
    case "UPDATE_SERVER":
      return {
        ...state,
        servers: state.servers.map((server) => (server.id === action.payload.id ? action.payload : server)),
      }
    case "DELETE_SERVER":
      return {
        ...state,
        servers: state.servers.filter((server) => server.id !== action.payload),
      }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}

interface ServerContextType extends ServerState {
  fetchServers: () => Promise<void>
  addServer: (serverData: Omit<Server, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateServer: (id: string, serverData: Partial<Server>) => Promise<void>
  deleteServer: (id: string) => Promise<void>
  clearError: () => void
}

const ServerContext = createContext<ServerContextType | undefined>(undefined)

export const useServers = () => {
  const context = useContext(ServerContext)
  if (context === undefined) {
    throw new Error("useServers must be used within a ServerProvider")
  }
  return context
}

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(serverReducer, initialState)

  const fetchServers = async () => {
    dispatch({ type: "FETCH_START" })
    try {
      const response = await monitoringApi.get("/server")
      dispatch({ type: "FETCH_SUCCESS", payload: response.data })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to fetch servers"
      dispatch({ type: "FETCH_FAILURE", payload: message })
    }
  }

  const addServer = async (serverData: Omit<Server, "id" | "createdAt" | "updatedAt">) => {
    try {
      const response = await monitoringApi.post("/server", serverData)
      dispatch({ type: "ADD_SERVER", payload: response.data })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to add server"
      dispatch({ type: "FETCH_FAILURE", payload: message })
      throw error
    }
  }

  const updateServer = async (id: string, serverData: Partial<Server>) => {
    try {
      const response = await monitoringApi.put(`/server/${id}`, serverData)
      dispatch({ type: "UPDATE_SERVER", payload: response.data })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to update server"
      dispatch({ type: "FETCH_FAILURE", payload: message })
      throw error
    }
  }

  const deleteServer = async (id: string) => {
    try {
      await monitoringApi.delete(`/server/${id}`)
      dispatch({ type: "DELETE_SERVER", payload: id })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to delete server"
      dispatch({ type: "FETCH_FAILURE", payload: message })
      throw error
    }
  }

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  useEffect(() => {
    fetchServers()
  }, [])

  return (
    <ServerContext.Provider
      value={{
        ...state,
        fetchServers,
        addServer,
        updateServer,
        deleteServer,
        clearError,
      }}
    >
      {children}
    </ServerContext.Provider>
  )
}
