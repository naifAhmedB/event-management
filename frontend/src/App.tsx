import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'

// Auth pages (eager-loaded)
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import OtpVerifyPage from './pages/auth/OtpVerifyPage'
import SetPasswordPage from './pages/auth/SetPasswordPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// App pages (lazy-loaded)
const MyEventsPage = lazy(() => import('./pages/events/MyEventsPage'))
const CreateEventPage = lazy(() => import('./pages/events/CreateEventPage'))
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage'))
const ScannerPage = lazy(() => import('./pages/scanner/ScannerPage'))
const InviteResponsePage = lazy(() => import('./pages/invite/InviteResponsePage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const PackagesManagement = lazy(() => import('./pages/admin/PackagesManagement'))
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'))
const AllEventsPage = lazy(() => import('./pages/admin/AllEventsPage'))
const PromoCodesManagement = lazy(() => import('./pages/admin/PromoCodesManagement'))

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent" />
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/verify" element={<OtpVerifyPage />} />
          <Route path="/signup/set-password" element={<SetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/forgot-password/reset" element={<SetPasswordPage />} />

          {/* Public invitation response page */}
          <Route path="/invite/:token" element={<InviteResponsePage />} />

          {/* Protected app routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/events" replace />} />
            <Route path="/events" element={<MyEventsPage />} />
            <Route path="/events/create" element={<CreateEventPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/scanner" element={<ScannerPage />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/packages"
              element={
                <ProtectedRoute adminOnly>
                  <PackagesManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <UsersManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute adminOnly>
                  <AllEventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/promos"
              element={
                <ProtectedRoute adminOnly>
                  <PromoCodesManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
