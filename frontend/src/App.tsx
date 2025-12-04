import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ReaderPortalPage from './pages/ReaderPortalPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminBookDetailPage from './pages/AdminBookDetailPage'
import AdminBooksPage from './pages/AdminBooksPage'
import AdminUsersPage from './pages/AdminUsersPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReaderPortalPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/books" element={<AdminBooksPage />} />
        <Route path="/admin/books/:id" element={<AdminBookDetailPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
