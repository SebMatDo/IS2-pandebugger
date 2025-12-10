import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../api/client'
import '../AdminUsersPage.css'

type UserFromApi = {
  id: number
  nombres: string
  apellidos: string
  correo_electronico: string
  rol: {
    id: number
    nombre: string
    descripcion?: string
  }
  estado: boolean
}

type UserRow = {
  id: number
  fullName: string
  initials: string
  email: string
  roleName: string
  tasks: number
  isActive: boolean
}

export default function AdminUsersPage() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true)
        setError(null)

        const res = await apiGet<{ status: string; data: UserFromApi[] }>(
          '/users'
        )

        if (res.status !== 'success') {
          throw new Error('Error al cargar usuarios')
        }

        const mapped: UserRow[] = res.data.map((u) => {
          const fullName = `${u.nombres} ${u.apellidos}`.trim()
          const parts = fullName.split(' ').filter(Boolean)
          const initials = parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase()

          return {
            id: u.id,
            fullName,
            initials,
            email: u.correo_electronico,
            roleName: u.rol?.nombre ?? '—',
            // cuando tengas tareas reales las pones aquí
            tasks: 0,
            isActive: Boolean(u.estado),
          }
        })

        setRows(mapped)
      } catch (err: any) {
        console.error(err)
        setError(err.message ?? 'Error al cargar usuarios')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const term = search.toLowerCase().trim()
        if (!term) return true

        return (
          row.fullName.toLowerCase().includes(term) ||
          row.email.toLowerCase().includes(term) ||
          row.roleName.toLowerCase().includes(term)
        )
      }),
    [rows, search]
  )

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-icon" />
          <span className="admin-logo-text">Workflow</span>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            className="admin-nav-item"
            onClick={() => navigate('/admin')}
          >
            Dashboard
          </button>
          <button
            className="admin-nav-item"
            onClick={() => navigate('/admin/books')}
          >
            Books
          </button>
          <button className="admin-nav-item">Assignments</button>
          <button
            className="admin-nav-item admin-nav-item-active"
            onClick={() => navigate('/admin/users')}
          >
            Users
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-users-header">
          <div>
            <h1 className="admin-users-title">User Management</h1>
            <p className="admin-users-subtitle">
              Manage team members and permissions
            </p>
          </div>

          <div className="admin-users-header-right">
            <button className="admin-primary-button">
              + Create User
            </button>
          </div>
        </header>

        {/* Search bar */}
        <section className="admin-users-toolbar">
          <input
            type="text"
            className="admin-users-search"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>

        {loading && <p>Cargando usuarios…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && (
          <section className="admin-users-content">
            {/* Tabla de usuarios */}
            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Tasks</th>
                    <th>Status</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="admin-users-user-cell">
                          <span className="admin-users-avatar">
                            {row.initials}
                          </span>
                          <span className="admin-users-name">
                            {row.fullName}
                          </span>
                        </div>
                      </td>
                      <td>{row.email}</td>
                      <td>{row.roleName}</td>
                      <td>{row.tasks}</td>
                      <td>
                        <span
                          className={
                            'admin-users-status-pill ' +
                            (row.isActive
                              ? 'admin-users-status-active'
                              : 'admin-users-status-inactive')
                          }
                        >
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-users-actions">
                          <button
                            type="button"
                            className="admin-users-action-btn"
                            title="Edit user"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="admin-users-action-btn"
                            title="Reset password"
                          >
                            🔑
                          </button>
                          <button
                            type="button"
                            className="admin-users-action-btn"
                            title="Deactivate"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>
                        No users found with the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Panel derecho - log (vacío de momento) */}
            <aside className="admin-users-activity">
              <h2 className="admin-users-activity-title">Recent Activity</h2>
              {/* Aquí luego añadimos las tarjetas del log */}
            </aside>
          </section>
        )}
      </main>
    </div>
  )
}
