import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ChangeEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'
import '../AdminBooksPage.css'

type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7

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
  }
  categoria?: {
    id: number
    nombre: string
    descripcion?: string | null
  }
  directorio_pdf?: string | null
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

type CreateBookForm = {
  title: string
  author: string
  isbn: string
  totalPages: string
  categoryId: string // id numérico de categoría (opcional)
  shelf: string      // estanteria
  space: string      // espacio
  publicationDate: string // yyyy-mm-dd
  pdfPath: string         // directorio_pdf opcional
  statusId: StageId       // estado_id obligatorio
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10) // yyyy-mm-dd
}

function getStatusPillClass(id: StageId): string {
  switch (id) {
    case 1:
      return 'admin-status-pill-reception'
    case 2:
      return 'admin-status-pill-review'
    case 3:
      return 'admin-status-pill-restoration'
    case 4:
      return 'admin-status-pill-digitization'
    case 5:
      return 'admin-status-pill-quality'
    case 6:
      return 'admin-status-pill-classification'
    case 7:
      return 'admin-status-pill-published'
    default:
      return ''
  }
}

export default function AdminBooksPage() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<BookRow[]>([])
  const [books, setBooks] = useState<BookFromApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateBookForm>({
    title: '',
    author: '',
    isbn: '',
    totalPages: '',
    categoryId: '',
    shelf: '',
    space: '',
    publicationDate: '',
    pdfPath: '',
    statusId: 1,
  })

  const [showCategoryHelp, setShowCategoryHelp] = useState(false)

  const [statusFilter] = useState<'all' | StageId>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all')


  async function loadBooks() {
    try {
      setLoading(true)
      setError(null)

      const res = await apiGet<{ success: boolean; data: BookFromApi[] }>(
        '/books'
      )

      if (!res.success) {
        throw new Error('Error al cargar libros')
      }

      setBooks(res.data)

      const mapped: BookRow[] = res.data.map((b) => ({
        id: b.id,
        code: b.isbn || `BK-${String(b.id).padStart(3, '0')}`,
        title: b.titulo,
        author: b.autor || '—',
        statusId: b.estado?.id ?? 1,
        statusName: b.estado?.nombre ?? '',
        categoryName: b.categoria?.nombre ?? 'Sin categoría',
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

  useEffect(() => {
    loadBooks()
  }, [])

  function openCreateModal() {
    setCreateError(null)
    setCreateForm({
      title: '',
      author: '',
      isbn: '',
      totalPages: '',
      categoryId: '',
      shelf: '',
      space: '',
      publicationDate: '',
      pdfPath: '',
      statusId: 1,
    })
    setIsCreateOpen(true)
  }

  function closeCreateModal() {
    if (createLoading) return
    setShowCategoryHelp(false)
    setIsCreateOpen(false)
  }

  function handleCreateChange(field: keyof CreateBookForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setCreateForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }))
    }
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)

    const {
      title,
      author,
      isbn,
      totalPages,
      categoryId,
      shelf,
      space,
      publicationDate,
      pdfPath,
      statusId,
    } = createForm

    // Validaciones mínimas (campos obligatorios)
    if (
      !title.trim() ||
      !author.trim() ||
      !isbn.trim() ||
      !publicationDate.trim() ||
      !shelf.trim() ||
      !space.trim()
    ) {
      setCreateError(
        'Title, Author, ISBN, Publication date, Shelf y Space son obligatorios.'
      )
      return
    }

    // Total páginas (opcional, pero si lo ponen debe ser número)
    const paginas =
      totalPages.trim() === '' ? null : Number(totalPages.trim())

    if (paginas !== null && Number.isNaN(paginas)) {
      setCreateError('Total Pages debe ser un número.')
      return
    }

    // Category ID opcional, pero numérico
    const categoria_id =
      categoryId.trim() === '' ? null : Number(categoryId.trim())

    if (categoria_id !== null && Number.isNaN(categoria_id)) {
      setCreateError('Category ID debe ser un número.')
      return
    }

    // Fecha → ISO
    const dateObj = new Date(publicationDate)
    if (Number.isNaN(dateObj.getTime())) {
      setCreateError('Publication date no es válida.')
      return
    }
    const fechaISO = dateObj.toISOString()

    try {
      setCreateLoading(true)
      
      const payload = {
        isbn: isbn.trim(),
        titulo: title.trim(),
        autor: author.trim(),
        fecha: fechaISO,
        numero_paginas: paginas,
        estanteria: shelf.trim(),
        espacio: space.trim(),
        estado_id: statusId,
        categoria_id,
        directorio_pdf: pdfPath.trim() || null,
      }

      await apiPost('/books', payload)

      // Refrescamos la tabla
      await loadBooks()

      // Cerramos modal
      setIsCreateOpen(false)
    } catch (err: any) {
      console.error(err)
      setCreateError(err.message ?? 'Error al crear el libro')
    } finally {
      setCreateLoading(false)
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.categoryName))).sort(),
    [rows]
  )

  const categoryOptions = useMemo(
    () => {
      const map = new Map<number, string>()

      books.forEach((b) => {
        if (b.categoria?.id && b.categoria.nombre) {
          map.set(b.categoria.id, b.categoria.nombre)
        }
      })

      return Array.from(map.entries())
        .map(([id, nombre]) => ({ id, nombre }))
        .sort((a, b) => a.id - b.id)
    },
    [books]
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
            onClick={() => navigate('/admin/books')}
          >
            Books
          </button>
          <button className="admin-nav-item">Assignments</button>
          <button
            className="admin-nav-item"
            onClick={() => navigate('/admin/users')}
          >
            Users
          </button>
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
            <button
              className="admin-primary-button"
              type="button"
              onClick={openCreateModal}
            >
              + Create New Book
            </button>
          </div>
        </header>

        {/* Barra de filtros / búsqueda */}
        <section className="admin-books-toolbar">
          <div className="admin-books-toolbar-left">
            <button className="admin-secondary-button">Bulk Assign</button>
          </div>

          <div className="admin-books-toolbar-right">
            <input
              type="text"
              className="admin-books-search"
              placeholder="Search by title, author, or ISBN"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

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
                  <th style={{ width: '140px' }}>ISBN</th>
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
                {filteredRows.map((row) => {
                  const book = books.find((b) => b.id === row.id)

                  return (
                    <tr
                      key={row.id}
                      className="admin-books-row"
                      onClick={() => {
                        if (!book) return
                        navigate(`/admin/books/${book.id}`, { state: { book } })
                      }}
                    >
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
                      <td>—{/* responsable real luego */}</td>
                      <td>{row.updatedAt || '—'}</td>
                      <td>
                        <button
                          className="admin-row-menu-button"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⋮
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ textAlign: 'center', padding: '1rem' }}
                    >
                      No books found with the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* Modal de creación */}
        {isCreateOpen && (
          <div className="admin-modal-backdrop">
            <div className="admin-modal">
              <header className="admin-modal-header">
                <h2 className="admin-modal-title">Create New Book</h2>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={closeCreateModal}
                >
                  ✕
                </button>
              </header>

              <p className="admin-modal-subtitle">
                Add a new book to the archive workflow
              </p>

              {createError && (
                <p className="admin-modal-error">{createError}</p>
              )}

              <form className="admin-modal-form" onSubmit={handleCreateSubmit}>
                {/* 1ª fila: Title / Author */}
                <div className="admin-modal-row">
                  <div className="admin-modal-field">
                    <label className="admin-modal-label">Title *</label>
                    <input
                      type="text"
                      className="admin-modal-input"
                      placeholder="Enter book title"
                      value={createForm.title}
                      onChange={handleCreateChange('title')}
                    />
                  </div>

                  <div className="admin-modal-field">
                    <label className="admin-modal-label">Author *</label>
                    <input
                      type="text"
                      className="admin-modal-input"
                      placeholder="Enter author name"
                      value={createForm.author}
                      onChange={handleCreateChange('author')}
                    />
                  </div>
                </div>

                {/* 2ª fila: ISBN / Publication date */}
                <div className="admin-modal-row">
                  <div className="admin-modal-field">
                    <label className="admin-modal-label">ISBN *</label>
                    <input
                      type="text"
                      className="admin-modal-input"
                      placeholder="978-X-XXX-XXXXXX-X"
                      value={createForm.isbn}
                      onChange={handleCreateChange('isbn')}
                    />
                  </div>

                  <div className="admin-modal-field">
                    <label className="admin-modal-label">
                      Publication date *
                    </label>
                    <input
                      type="date"
                      className="admin-modal-input"
                      value={createForm.publicationDate}
                      onChange={handleCreateChange('publicationDate')}
                    />
                  </div>
                </div>

                {/* 3ª fila: Total Pages / Category ID (opcional) */}

                <div className="admin-modal-row">
                  <div className="admin-modal-field">
                    <label className="admin-modal-label">Total Pages</label>
                    <input
                      type="number"
                      min={0}
                      className="admin-modal-input"
                      placeholder="0"
                      value={createForm.totalPages}
                      onChange={handleCreateChange('totalPages')}
                    />
                  </div>

                  <div className="admin-modal-field admin-modal-field-with-popover">
                    <label className="admin-modal-label">
                      Category ID (optional)
                    </label>

                    <div className="admin-modal-input-with-icon">
                      <input
                        type="number"
                        min={0}
                        className="admin-modal-input"
                        placeholder="e.g. 11"
                        value={createForm.categoryId}
                        onChange={handleCreateChange('categoryId')}
                      />

                      {/* Botón de información */}
                      <button
                        type="button"
                        className="admin-modal-icon-button"
                        onClick={() => setShowCategoryHelp((v) => !v)}
                        title="View available categories"
                      >
                        !
                      </button>

                      {/* Popover a la derecha */}
                      {showCategoryHelp && (
                        <div className="admin-modal-popover">
                          <p className="admin-modal-popover-title">
                            Available categories
                          </p>

                          {categoryOptions.length > 0 ? (
                            <ul className="admin-modal-popover-list">
                              {categoryOptions.map((c) => (
                                <li key={c.id}>
                                  <strong>{c.id}</strong> – {c.nombre}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="admin-modal-popover-empty">
                              No categories found in current books.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4ª fila: Shelf / Space */}
                <div className="admin-modal-row">
                  <div className="admin-modal-field">
                    <label className="admin-modal-label">Shelf *</label>
                    <input
                      type="text"
                      className="admin-modal-input"
                      placeholder="e.g. I"
                      value={createForm.shelf}
                      onChange={handleCreateChange('shelf')}
                    />
                  </div>

                  <div className="admin-modal-field">
                    <label className="admin-modal-label">Space *</label>
                    <input
                      type="text"
                      className="admin-modal-input"
                      placeholder="e.g. 001"
                      value={createForm.space}
                      onChange={handleCreateChange('space')}
                    />
                  </div>
                </div>

                {/* 5ª fila: Status / PDF path */}
                <div className="admin-modal-row">

                  <div className="admin-modal-field">
                    <label className="admin-modal-label">
                      PDF path (optional)
                    </label>
                    <input
                      type="text"
                      className="admin-modal-input"
                      placeholder="/books/principito.pdf"
                      value={createForm.pdfPath}
                      onChange={handleCreateChange('pdfPath')}
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={closeCreateModal}
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-primary-button"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Creating…' : 'Create Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
