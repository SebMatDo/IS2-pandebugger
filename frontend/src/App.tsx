import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ReaderPortalPage from './pages/ReaderPortalPage'
import AdminDashboardPage from './pages/AdminDashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReaderPortalPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
