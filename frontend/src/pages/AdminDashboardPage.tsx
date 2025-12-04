import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          <button 
          className="admin-nav-item admin-nav-item-active"
          onClick={() => navigate('/admin')}
          >
            Dashboard
          </button>

          <button className="admin-nav-item"
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
                    onClick={() =>
                      navigate(`/admin/books/${card.id}`, {
                        state: { book: card.book },
                      })
                    }
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
      </main>
    </div>
  )
}
