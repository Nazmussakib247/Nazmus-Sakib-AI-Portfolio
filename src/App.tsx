import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from "./pages/Login"
import NotFound from './pages/NotFound'
import CaseStudy from './pages/CaseStudy'
import AdminLogin from './pages/admin/AdminLogin'
import AdminPasswordRecovery from './pages/admin/AdminPasswordRecovery'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects/:slug/case-study" element={<CaseStudy />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/recover" element={<AdminPasswordRecovery />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
