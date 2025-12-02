import { useEffect, useState } from 'react'
import { apiGet } from '../api/client'
import '../AdminDashboardPage.css'

type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7

type Stage = {
  id: StageId
  title: string
}

type BookFromApi = {
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

type Card = {
  id: number
  title: string
  code: string
  assignee: string
  due: string
  priority: 'High' | 'Medium' | 'Low'
  stageId: StageId
  statusName: string
  book: BookFromApi           // ⬅ nuevo
}

const stages: Stage[] = [
  { id: 1, title: 'In Reception' },        // Recepción
  { id: 2, title: 'In Review' },           // Revisión
  { id: 3, title: 'Restoration' },         // Restauración
  { id: 4, title: 'Digitization' },        // Digitalización
  { id: 5, title: 'Quality Control' },     // Control de calidad (nueva)
  { id: 6, title: 'Classification' },      // Clasificación
  { id: 7, title: 'Published' },           // Publicado
]

type BookDetailProps = {
  book: BookFromApi
  onBack: () => void
}

function BookDetailView({ book, onBack }: BookDetailProps) {
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
    <div className="book-detail">
      {/* Barra superior */}
      <header className="book-detail-header">
        <button className="book-detail-back" onClick={onBack}>
          ← Back to Dashboard
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

      {/* Timeline de etapas (decorativo por ahora) */}
      <section className="book-detail-steps">
        <div className="book-detail-step-row">
          {stages.map((stage) => (
            <div key={stage.id} className="book-detail-step">
              <div
                className={
                  'book-detail-step-circle' +
                  (book.estado?.id === stage.id ? ' book-detail-step-active' : '')
                }
              >
                {stage.id}
              </div>
              <span className="book-detail-step-label">{stage.title}</span>
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
            <span className="book-detail-field-value">{categoria}</span>
          </p>
          {categoriaDesc && (
            <p>
              <span className="book-detail-field-label">Category details:</span>{' '}
              <span className="book-detail-field-value">{categoriaDesc}</span>
            </p>
          )}
          <p>
            <span className="book-detail-field-label">Pages:</span>{' '}
            <span className="book-detail-field-value">{paginas}</span>
          </p>
          <p>
            <span className="book-detail-field-label">Publication date:</span>{' '}
            <span className="book-detail-field-value">{fechaPublicacion}</span>
          </p>
        </div>

        <div className="book-detail-card">
          <h2 className="book-detail-card-title">Current Status</h2>
          <p>
            <span className="book-detail-field-label">Status:</span>{' '}
            <span className="book-detail-field-value">{estadoNombre}</span>
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
            <span className="book-detail-field-value">{shelf}</span>
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
              No digital file available.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<BookFromApi | null>(null)

  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true)
        setError(null)

        const res = await apiGet<{ success: boolean; data: BookFromApi[] }>('/books')

        if (!res.success) {
          throw new Error('Error al cargar libros')
        }

        const mapped: Card[] = res.data.map((b) => {
          let due = ''
          if (b.fecha) {
            const d = new Date(b.fecha)
            if (!isNaN(d.getTime())) {
              due = d.toISOString().slice(0, 10) // yyyy-mm-dd
            }
          }

          return {
            id: b.id,
            title: b.titulo,
            code: b.isbn || `BK-${String(b.id).padStart(3, '0')}`,
            assignee: b.autor || 'Sin asignar',
            due,
            priority: 'Medium', // de momento fijo, luego lo refinamos
            stageId: b.estado?.id ?? 1,
            statusName: b.estado?.nombre ?? '',
            book: b,
          }
        })

        setCards(mapped)
      } catch (err: any) {
        console.error(err)
        setError(err.message ?? 'Error al cargar libros')
      } finally {
        setLoading(false)
      }
    }

    loadBooks()
  }, [])

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-icon"></div>
          <span className="admin-logo-text">Workflow </span>
        </div>

        <nav className="admin-sidebar-nav">
          <button className="admin-nav-item admin-nav-item-active">Dashboard</button>
          <button className="admin-nav-item">Books</button>
          <button className="admin-nav-item">Assignments</button>
          <button className="admin-nav-item">Categories</button>
          <button className="admin-nav-item">Users</button>
          <button className="admin-nav-item">Reports</button>
          <button className="admin-nav-item">Settings</button>
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
          {selectedBook ? (
            <BookDetailView
              book={selectedBook}
              onBack={() => setSelectedBook(null)}
            />
          ) : (
            <>
              {loading && <p>Cargando libros…</p>}
              {error && <p style={{ color: 'red' }}>{error}</p>}

              {/* Top bar */}
              <header className="admin-topbar">
                <div>
                  <h1 className="admin-title">Book Workflow Dashboard</h1>
                  <p className="admin-subtitle">
                    Track books through processing stages
                  </p>
                </div>

                <div className="admin-topbar-right">
                  <input
                    type="text"
                    placeholder="Search books, users..."
                    className="admin-search-input"
                  />
                </div>
              </header>

        {/* Stats cards */}
        <section className="admin-stats-row">
          <div className="admin-stat-card">
            <span className="admin-stat-label">Books in Queue</span>
            <span className="admin-stat-value">12</span>
            <span className="admin-stat-trend admin-stat-trend-positive">
              +12% this week
            </span>
          </div>

          <div className="admin-stat-card admin-stat-card-alert">
            <span className="admin-stat-label">Overdue Tasks</span>
            <span className="admin-stat-value">12</span>
            <span className="admin-stat-trend admin-stat-trend-negative">
              Requires attention
            </span>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-label">Avg Time per Stage</span>
            <span className="admin-stat-value">3.2 days</span>
            <span className="admin-stat-trend">Within target</span>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-label">Published This Month</span>
            <span className="admin-stat-value">28</span>
            <span className="admin-stat-trend admin-stat-trend-positive">
              +8% vs last month
            </span>
          </div>
        </section>

        {/* Filters */}
        <section className="admin-filters-row">
          <button className="admin-filter-pill">All Statuses</button>
          <button className="admin-filter-pill">All Assignees</button>
          <button className="admin-filter-reset">Reset Filters</button>
        </section>

        {/* Kanban board */}
        <section className="admin-board">
          {stages.map((stage) => {
          const cardsInStage = cards.filter((card) => card.stageId === stage.id)

          return (
            <div key={stage.id} className="admin-column">
              <header className="admin-column-header">
                <span className="admin-column-title">{stage.title}</span>
                <span className="admin-column-count">
                  {cardsInStage.length}
                </span>
              </header>

              <div className="admin-column-body">
                {cardsInStage.map((card) => (
                  <article
                    key={card.id}
                    className="admin-card"
                    onClick={() => setSelectedBook(card.book)}
                  >

                      <div className="admin-card-header">
                        <span className="admin-card-title">{card.title}</span>
                      </div>
                      
                      <div className="admin-card-priority-row">
                        <span
                          className={`admin-card-badge admin-card-badge-${card.priority.toLowerCase()}`}
                        >
                          {card.priority}
                        </span>
                      </div>

                      <div className="admin-card-footer">

                          <div className="admin-card-assignee">
                            <span className="admin-assignee-name">
                              {card.assignee}
                            </span>
                          </div>
                          {card.due && (
                            <span className="admin-card-date">
                              {card.due}
                            </span>
                          )}

                          {card.statusName && (
                            <span className="admin-card-status">
                              {card.statusName}
                            </span>
                          )}
                      </div>

                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
        </>
          )}
      </main>
    </div>
  )
}
