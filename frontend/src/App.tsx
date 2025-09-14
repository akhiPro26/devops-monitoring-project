import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/protectedRoutes"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { DashboardPage } from "./pages/DashboardPage"
import { ServerProvider } from "./context/ServerContext"
import { ServersPage } from "./pages/ServerPage"
import { MonitoringProvider } from "./context/MonitoringContext"
import { MonitoringPage } from "./pages/MonitoringPage"
import { ChatProvider } from "./context/ChatContext"
import { AIChatPage } from "./pages/AIChatsPage"
import { AlertProvider } from "./context/AlertContext"
import { AlertsPage } from "./pages/AlertPage"

function App() {
  return (
    <AuthProvider>
      <ServerProvider>
        <MonitoringProvider>
          <ChatProvider>
            <AlertProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <Routes>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/servers" element={<ServersPage />} />
                            <Route path="/monitoring" element={<MonitoringPage />} />
                            <Route path="/ai-chat" element={<AIChatPage />} />
                            <Route path="/alerts" element={<AlertsPage />} />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          </Routes>
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Router>
            </AlertProvider>
          </ChatProvider>
        </MonitoringProvider>
      </ServerProvider>
    </AuthProvider>
  )
}

export default App
