import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ReaderPortalPage from './pages/ReaderPortalPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminBookDetailPage from './pages/AdminBookDetailPage'
import AdminBooksPage from './pages/AdminBooksPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReaderPortalPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/books" element={<AdminBooksPage />} />
        <Route path="/admin/books/:id" element={<AdminBookDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
