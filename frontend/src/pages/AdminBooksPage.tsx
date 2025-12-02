import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../api/client'
import '../AdminBooksPage.css'

type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7

type BookFromApi = {
  id: number
  titulo: string
  autor: string
  isbn: string | null
  fecha: string | null
  estado: {
    id: StageId
    nombre: string
  }
  categoria?: {
    nombre: string
  }
  // Si luego el backend te da created_at / updated_at los añades aquí
}

type BookRow = {
  id: number
  code: string
  title: string
  author: string
  statusId: StageId
  statusName: string
  categoryName: string
  updatedAt: string
}



function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10) // yyyy-mm-dd
}

function getStatusPillClass(id: StageId): string {
  switch (id) {
    case 1: return 'admin-status-pill-reception'
    case 2: return 'admin-status-pill-review'
    case 3: return 'admin-status-pill-restoration'
    case 4: return 'admin-status-pill-digitization'
    case 5: return 'admin-status-pill-quality'
    case 6: return 'admin-status-pill-classification'
    case 7: return 'admin-status-pill-published'
    default: return ''
  }
}

export default function AdminBooksPage() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<BookRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | StageId>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all')

  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true)
        setError(null)

        const res = await apiGet<{ success: boolean; data: BookFromApi[] }>('/books')

        if (!res.success) {
          throw new Error('Error al cargar libros')
        }

        const mapped: BookRow[] = res.data.map((b) => ({
          id: b.id,
          code: b.isbn || `BK-${String(b.id).padStart(3, '0')}`,
          title: b.titulo,
          author: b.autor || '—',
          statusId: b.estado?.id ?? 1,
          statusName: b.estado?.nombre ?? '',
          categoryName: b.categoria?.nombre ?? 'Sin categoría',
          // Por ahora usamos fecha como "Updated".
          updatedAt: formatDate(b.fecha),
        }))

        setRows(mapped)
      } catch (err: any) {
        console.error(err)
        setError(err.message ?? 'Error al cargar libros')
      } finally {
        setLoading(false)
      }
    }

    loadBooks()
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.categoryName))).sort(),
    [rows]
  )

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const term = search.toLowerCase().trim()
        const matchesSearch =
          !term ||
          row.title.toLowerCase().includes(term) ||
          row.author.toLowerCase().includes(term) ||
          row.code.toLowerCase().includes(term)

        const matchesStatus =
          statusFilter === 'all' || row.statusId === statusFilter

        const matchesCategory =
          categoryFilter === 'all' || row.categoryName === categoryFilter

        return matchesSearch && matchesStatus && matchesCategory
      }),
    [rows, search, statusFilter, categoryFilter]
  )

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-icon"></div>
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
          className="admin-nav-item admin-nav-item-active"
          onClick={() => navigate('/admin')}
          >
            Books
          </button>
          <button className="admin-nav-item">Assignments</button>
          <button className="admin-nav-item">Categories</button>
          <button className="admin-nav-item">Users</button>
          <button className="admin-nav-item">Reports</button>
          <button className="admin-nav-item">Settings</button>
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Cabecera */}
        <header className="admin-books-header">
          <div>
            <h1 className="admin-books-title">Books</h1>
            <p className="admin-books-subtitle">
              Manage the book collection
            </p>
          </div>

          <div className="admin-books-header-right">
            <button className="admin-primary-button">
              + Create New Book
            </button>
          </div>
        </header>

        {/* Barra de filtros / búsqueda */}
        <section className="admin-books-toolbar">
          <div className="admin-books-toolbar-left">
            <button className="admin-secondary-button">Bulk Assign</button>
            <button className="admin-secondary-button">Change Status</button>
            <button className="admin-secondary-button">Export</button>
          </div>

          <div className="admin-books-toolbar-right">
            <input
              type="text"
              className="admin-books-search"
              placeholder="Search by title, author, or Book ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="admin-books-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value === 'all'
                    ? 'all'
                    : (Number(e.target.value) as StageId)
                )
              }
            >
              <option value="all">Status</option>
              <option value={1}>In Reception</option>
              <option value={2}>In Review</option>
              <option value={3}>Restoration</option>
              <option value={4}>Digitization</option>
              <option value={5}>Quality Control</option>
              <option value={6}>Classification</option>
              <option value={7}>Published</option>
            </select>

            <select
              className="admin-books-select"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value === 'all' ? 'all' : e.target.value
                )
              }
            >
              <option value="all">Category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading && <p>Cargando libros…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Tabla */}
        {!loading && !error && (
          <section className="admin-books-table-wrapper">
            <table className="admin-books-table">
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Book ID</th>
                  <th style={{ width: '140px' }}>Title</th>
                  <th style={{ width: '150px' }}>Author</th>
                  <th style={{ width: '130px' }}>Status</th>
                  <th style={{ width: '130px' }}>Category</th>
                  <th style={{ width: '180px' }}>Assignee</th>
                  <th style={{ width: '100px' }}>Updated</th>
                  <th style={{ width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.code}</td>
                    <td>{row.title}</td>
                    <td>{row.author}</td>
                    <td>
                      <span
                        className={`admin-status-pill ${getStatusPillClass(
                          row.statusId
                        )}`}
                      >
                        {row.statusName || '—'}
                      </span>
                    </td>
                    <td>{row.categoryName}</td>
                    <td>—{/* aquí luego puedes poner el responsable real */}</td>
                    <td>{row.updatedAt || '—'}</td>
                    <td>
                      <button className="admin-row-menu-button">⋮</button>
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '1rem' }}>
                      No books found with the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  )
}
