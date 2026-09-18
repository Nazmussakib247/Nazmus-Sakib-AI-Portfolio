import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import ProfileMetadata from './components/ProfileMetadata'

const CaseStudy = lazy(() => import('./pages/CaseStudy'))
const Login = lazy(() => import('./pages/Login'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminPasswordRecovery = lazy(() => import('./pages/admin/AdminPasswordRecovery'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

function RouteFallback() {
  return <main className="min-h-screen bg-[#05060f] px-6 py-32 text-center font-mono text-xs uppercase tracking-[0.2em] text-gray-500">Loading…</main>
}

export default function App() {
  return (
    <>
      <ProfileMetadata />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/:slug/case-study" element={<CaseStudy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/recover" element={<AdminPasswordRecovery />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}
