import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'))
const PublicArtifactView = lazy(() => import('./pages/PublicArtifactView.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<main role="status" className="grid min-h-screen place-items-center bg-cream text-burgundy">Memuat museum…</main>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/artifact/:id" element={<PublicArtifactView />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
