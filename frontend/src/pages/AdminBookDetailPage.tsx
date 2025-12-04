// src/pages/AdminBookDetailPage.tsx
import { useLocation, useNavigate } from 'react-router-dom'
import '../AdminDashboardPage.css'

type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7

type Stage = {
  id: StageId
  title: string
}

const stages: Stage[] = [
  { id: 1, title: 'In Reception' },
  { id: 2, title: 'In Review' },
  { id: 3, title: 'Restoration' },
  { id: 4, title: 'Digitization' },
  { id: 5, title: 'Quality Control' },
  { id: 6, title: 'Classification' },
  { id: 7, title: 'Published' },
]

export type BookFromApi = {
  id: number
  titulo: string
  autor: string
  isbn: string | null
  fecha: string | null
  numero_paginas?: number | null
  estanteria?: string | null
  espacio?: string | null
  estado: {
    id: StageId
    nombre: string
    descripcion?: string | null
  }
  categoria?: {
    nombre: string
    descripcion?: string | null
  }
  directorio_pdf?: string | null
}

export default function AdminBookDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as { book?: BookFromApi } | null
  const book = state?.book

  // Si se entra directo sin state, devolvemos al dashboard
  if (!book) {
    return (
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-logo-icon" />
            <span className="admin-logo-text">Workflow</span>
          </div>

          <nav className="admin-sidebar-nav">
            <button
              className="admin-nav-item admin-nav-item-active"
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
            <button className="admin-nav-item">Categories</button>
            <button className="admin-nav-item">Users</button>
            <button className="admin-nav-item">Reports</button>
            <button className="admin-nav-item">Settings</button>
          </nav>
        </aside>

        <main className="admin-main">
          <button
            className="book-detail-back"
            onClick={() => navigate('/admin')}
          >
            ← 
          </button>
          <p>Book not found. Please go back to the dashboard.</p>
        </main>
      </div>
    )
  }

  const fechaPublicacion = book.fecha
    ? new Date(book.fecha).toLocaleDateString('es-CO')
    : 'Sin fecha'

  const categoria = book.categoria?.nombre ?? 'Sin categoría'
  const categoriaDesc = book.categoria?.descripcion ?? ''
  const estadoNombre = book.estado?.nombre ?? 'Sin estado'
  const estadoDescripcion = book.estado?.descripcion ?? ''
  const shelf =
    [book.estanteria, book.espacio].filter(Boolean).join(' - ') || 'Sin ubicación'
  const paginas =
    typeof book.numero_paginas === 'number' ? book.numero_paginas : '—'

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
          <button className="admin-nav-item">Categories</button>
          <button className="admin-nav-item">Users</button>
          <button className="admin-nav-item">Reports</button>
          <button className="admin-nav-item">Settings</button>
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="book-detail">
          {/* Barra superior */}
          <header className="book-detail-header">
            <button
              className="book-detail-back"
              onClick={() => navigate(-1)}
            >
              ← 
            </button>

            <div className="book-detail-header-main">
              <div>
                <h1 className="book-detail-title">{book.titulo}</h1>
                <p className="book-detail-author">by {book.autor}</p>
              </div>

              <div className="book-detail-header-meta">
                <div className="book-detail-meta-block">
                  <span className="book-detail-meta-label">Book ID</span>
                  <span className="book-detail-meta-value">
                    BK-{String(book.id).padStart(4, '0')}
                  </span>
                </div>
                <div className="book-detail-meta-block">
                  <span className="book-detail-meta-label">ISBN</span>
                  <span className="book-detail-meta-value">
                    {book.isbn ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Timeline de etapas */}
          <section className="book-detail-steps">
            <div className="book-detail-step-row">
              {stages.map((stage) => (
                <div key={stage.id} className="book-detail-step">
                  <div
                    className={
                      'book-detail-step-circle' +
                      (book.estado?.id === stage.id
                        ? ' book-detail-step-active'
                        : '')
                    }
                  >
                    {stage.id}
                  </div>
                  <span className="book-detail-step-label">
                    {stage.title}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Tarjetas de info */}
          <section className="book-detail-grid">
            <div className="book-detail-card">
              <h2 className="book-detail-card-title">Catalog Information</h2>
              <p>
                <span className="book-detail-field-label">Category:</span>{' '}
                <span className="book-detail-field-value">
                  {categoria}
                </span>
              </p>
              {categoriaDesc && (
                <p>
                  <span className="book-detail-field-label">
                    Category details:
                  </span>{' '}
                  <span className="book-detail-field-value">
                    {categoriaDesc}
                  </span>
                </p>
              )}
              <p>
                <span className="book-detail-field-label">Pages:</span>{' '}
                <span className="book-detail-field-value">
                  {paginas}
                </span>
              </p>
              <p>
                <span className="book-detail-field-label">
                  Publication date:
                </span>{' '}
                <span className="book-detail-field-value">
                  {fechaPublicacion}
                </span>
              </p>
            </div>

            <div className="book-detail-card">
              <h2 className="book-detail-card-title">Current Status</h2>
              <p>
                <span className="book-detail-field-label">Status:</span>{' '}
                <span className="book-detail-field-value">
                  {estadoNombre}
                </span>
              </p>
              {estadoDescripcion && (
                <p>
                  <span className="book-detail-field-label">Details:</span>{' '}
                  <span className="book-detail-field-value">
                    {estadoDescripcion}
                  </span>
                </p>
              )}
              <p>
                <span className="book-detail-field-label">Location:</span>{' '}
                <span className="book-detail-field-value">
                  {shelf}
                </span>
              </p>
            </div>

            <div className="book-detail-card">
              <h2 className="book-detail-card-title">Digital File</h2>
              {book.directorio_pdf ? (
                <a
                  href={book.directorio_pdf}
                  target="_blank"
                  rel="noreferrer"
                  className="book-detail-link"
                >
                  Open PDF
                </a>
              ) : (
                <p className="book-detail-field-value">
                  PDF no disponible.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
