import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ReaderPortalPage from './pages/ReaderPortalPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminBooksPage from './pages/AdminBooksPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReaderPortalPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/adminBooks" element={<AdminBooksPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
