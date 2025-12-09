// src/pages/AdminBookDetailPage.tsx
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiPut } from '../api/client'
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

type TaskAssignment = {
  id: number
  usuario_id: number
  usuario_nombre: string
  fecha_finalizacion: string | null
}

type HistoryLog = {
  id: number
  accion: string
  usuario_nombre: string
  usuario_email: string
  fecha: string
  target_nombre?: string
  detalles?: any
}

type User = {
  id: number
  nombres: string
  apellidos: string
  correo_electronico: string
}

export default function AdminBookDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as { book?: BookFromApi } | null
  const book = state?.book

  // Estado del modal de edición
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    titulo: '',
    autor: '',
    isbn: '',
    fecha: '',
    numero_paginas: '',
    estanteria: '',
    espacio: '',
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Estado del modal de avanzar estado
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [advanceForm, setAdvanceForm] = useState({
    observaciones: '',
    pasoControlCalidad: false,
  })
  const [advanceLoading, setAdvanceLoading] = useState(false)
  const [advanceError, setAdvanceError] = useState<string | null>(null)

  // Estados para tabla de asignamiento
  const [currentTask, setCurrentTask] = useState<TaskAssignment | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [maxDate, setMaxDate] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  // Estados para tabla de historia
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)

  // Verificar permisos del usuario (Admin: 1, Bibliotecario: 2)
  const userRoleId = localStorage.getItem('userRoleId')
  const canEditBooks = userRoleId === '1' || userRoleId === '2'

  // Cargar tarea actual del libro (si existe)
  useEffect(() => {
    if (!book || book.estado.id >= 7) return // No cargar si está publicado

    const loadCurrentTask = async () => {
      try {
        const response = await apiGet<any>(`/tasks?libro_id=${book.id}`)
        console.log('Respuesta de tareas:', response) // Debug
        
        // Manejar diferentes estructuras de respuesta
        let tasksData: any[] = []
        
        if (response.status === 'success' && Array.isArray(response.data)) {
          tasksData = response.data
        } else if (response.success && Array.isArray(response.data)) {
          tasksData = response.data
        } else if (Array.isArray(response)) {
          tasksData = response
        }
        
        console.log('Tareas extraídas:', tasksData) // Debug
        
        if (tasksData.length > 0) {
          const task = tasksData[0]
          const mappedTask = {
            id: task.id,
            usuario_id: task.usuario_id,
            usuario_nombre: task.usuario 
              ? `${task.usuario.nombres} ${task.usuario.apellidos}` 
              : 'Sin asignar',
            fecha_finalizacion: task.fecha_finalizacion || task.fecha_asignacion || null,
          }
          
          console.log('Tarea mapeada:', mappedTask) // Debug
          setCurrentTask(mappedTask)
        } else {
          console.log('No se encontraron tareas para este libro')
          setCurrentTask(null)
        }
      } catch (err) {
        console.error('Error cargando tarea:', err)
      }
    }

    loadCurrentTask()
  }, [book])

  // Cargar historial del libro
  useEffect(() => {
    if (!book) return

    const loadHistory = async () => {
      setHistoryLoading(true)
      try {
        const response = await apiGet<{ status: string; data: { records: any[] } }>(`/history?target_type=libro&target_id=${book.id}`)
        if (response.status === 'success' && response.data?.records) {
          setHistoryLogs(
            response.data.records.map((log: any) => ({
              id: log.id,
              accion: log.accion_nombre || 'Acción desconocida',
              usuario_nombre: log.usuario_nombre || 'Sistema',
              usuario_email: log.usuario_email || '',
              fecha: log.fecha || log.created_at,
              target_nombre: log.target_nombre || '',
              detalles: log.detalles || {},
            }))
          )
        }
      } catch (err) {
        console.error('Error cargando historial:', err)
      } finally {
        setHistoryLoading(false)
      }
    }

    loadHistory()
  }, [book])

  // Abrir modal de asignación
  const openAssignModal = async () => {
    setShowAssignModal(true) // Abrir modal primero
    setAssignError(null)
    setUserSearch('')
    setSelectedUserId(currentTask?.usuario_id || null)
    
    // Establecer fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0]
    setMaxDate(currentTask?.fecha_finalizacion ? currentTask.fecha_finalizacion.split('T')[0] : today)
    
    // Cargar lista de usuarios
    try {
      const response = await apiGet<any>('/users')
      console.log('Respuesta completa de usuarios:', response) // Debug
      
      // Manejar diferentes estructuras de respuesta
      let usersData: any[] = []
      
      // Intentar extraer los usuarios de diferentes estructuras posibles
      if (response.data && Array.isArray(response.data)) {
        usersData = response.data
      } else if (response.data?.users && Array.isArray(response.data.users)) {
        usersData = response.data.users
      } else if (response.data?.records && Array.isArray(response.data.records)) {
        usersData = response.data.records
      } else if (Array.isArray(response)) {
        usersData = response
      }
      
      console.log('Usuarios extraídos:', usersData) // Debug
      console.log('Cantidad de usuarios:', usersData.length) // Debug
      
      if (usersData.length > 0) {
        const mappedUsers = usersData.map((user: any) => ({
          id: user.id,
          nombres: user.nombres || user.nombre || '',
          apellidos: user.apellidos || user.apellido || '',
          correo_electronico: user.correo_electronico || user.email || user.correo || '',
        }))
        
        console.log('Usuarios mapeados:', mappedUsers) // Debug
        setUsers(mappedUsers)
      } else {
        console.warn('No se encontraron usuarios en la respuesta')
        setAssignError('No se encontraron usuarios disponibles')
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err)
      setAssignError('No se pudieron cargar los usuarios')
    }
  }

  // Guardar cambio de asignación
  const handleSaveAssignment = async () => {
    if (!selectedUserId || !maxDate) {
      setAssignError('Debe seleccionar un usuario y una fecha')
      return
    }

    if (!book) return

    setAssignLoading(true)
    setAssignError(null)

    try {
      const selectedUser = users.find((u: User) => u.id === selectedUserId)
      
      if (currentTask) {
        // Actualizar tarea existente
        const updateResponse = await apiPut<any>(`/tasks/${currentTask.id}`, {
          usuario_id: selectedUserId,
          fecha_finalizacion: maxDate,
        })
        
        console.log('Respuesta de actualización de tarea:', updateResponse) // Debug

        setCurrentTask({
          ...currentTask,
          usuario_id: selectedUserId,
          usuario_nombre: selectedUser ? `${selectedUser.nombres} ${selectedUser.apellidos}` : 'Usuario',
          fecha_finalizacion: maxDate,
        })
      } else {
        // Crear nueva tarea
        const createResponse = await apiPost<any>('/tasks', {
          libro_id: book.id,
          usuario_id: selectedUserId,
          estado_nuevo_id: book.estado.id,
          fecha_finalizacion: maxDate,
        })
        
        console.log('Respuesta de creación de tarea:', createResponse) // Debug

        // Manejar diferentes estructuras de respuesta
        let taskData = null
        
        if (createResponse.success && createResponse.data) {
          taskData = createResponse.data
        } else if (createResponse.status === 'success' && createResponse.data) {
          taskData = createResponse.data
        } else if (createResponse.data) {
          taskData = createResponse.data
        }
        
        console.log('Datos de tarea creada:', taskData) // Debug

        if (taskData) {
          setCurrentTask({
            id: taskData.id,
            usuario_id: selectedUserId,
            usuario_nombre: selectedUser ? `${selectedUser.nombres} ${selectedUser.apellidos}` : 'Usuario',
            fecha_finalizacion: maxDate,
          })
        }
      }

      setShowAssignModal(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la asignación'
      setAssignError(errorMessage)
      console.error('Error en handleSaveAssignment:', err) // Debug
    } finally {
      setAssignLoading(false)
    }
  }

  const openEditModal = () => {
    if (!book) return
    setEditForm({
      titulo: book.titulo || '',
      autor: book.autor || '',
      isbn: book.isbn || '',
      fecha: book.fecha ? book.fecha.split('T')[0] : '',
      numero_paginas: book.numero_paginas?.toString() || '',
      estanteria: book.estanteria || '',
      espacio: book.espacio || '',
    })
    setEditError(null)
    setShowEditModal(true)
  }

  // Guardar cambios
  const handleSaveBook = async () => {
    if (!book) return
    setEditLoading(true)
    setEditError(null)

    try {
      const payload = {
        titulo: editForm.titulo,
        autor: editForm.autor,
        isbn: editForm.isbn || null,
        fecha: editForm.fecha || null,
        numero_paginas: editForm.numero_paginas ? parseInt(editForm.numero_paginas) : null,
        estanteria: editForm.estanteria || null,
        espacio: editForm.espacio || null,
      }

      await apiPut(`/books/${book.id}`, payload)
      
      // Actualizar el state local para reflejar cambios
      if (state?.book) {
        state.book.titulo = payload.titulo
        state.book.autor = payload.autor
        state.book.isbn = payload.isbn
        state.book.fecha = payload.fecha
        state.book.numero_paginas = payload.numero_paginas
        state.book.estanteria = payload.estanteria
        state.book.espacio = payload.espacio
      }
      
      setShowEditModal(false)
      // Forzar re-render navegando a la misma página
      navigate(`/admin/books/${book.id}`, { state: { book: { ...book, ...payload } }, replace: true })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el libro'
      setEditError(errorMessage)
    } finally {
      setEditLoading(false)
    }
  }

  // Abrir modal de avanzar estado
  const openAdvanceModal = () => {
    setAdvanceForm({
      observaciones: '',
      pasoControlCalidad: false,
    })
    setAdvanceError(null)
    setShowAdvanceModal(true)
  }

  // Avanzar estado del libro
  const handleAdvanceState = async () => {
    if (!book) return
    
    // Validaciones
    if (!advanceForm.pasoControlCalidad) {
      setAdvanceError('Debe marcar que el libro pasó el control de calidad')
      return
    }

    if (!advanceForm.observaciones.trim()) {
      setAdvanceError('Debe ingresar observaciones sobre el cambio de estado')
      return
    }
    
    // No avanzar si ya está en el último estado (7 = Disponible/Publicado)
    if (book.estado.id >= 7) {
      setAdvanceError('El libro ya está en el estado final')
      return
    }

    setAdvanceLoading(true)
    setAdvanceError(null)

    try {
      const nextStateId = (book.estado.id + 1) as StageId
      
      const payload = {
        estado_id: nextStateId,
        // Incluir observaciones si las hay
        ...(advanceForm.observaciones && { observaciones: advanceForm.observaciones }),
      }

      await apiPut(`/books/${book.id}`, payload)
      
      // Actualizar el state local
      const updatedBook = {
        ...book,
        estado: {
          ...book.estado,
          id: nextStateId,
          nombre: stages.find(s => s.id === nextStateId)?.title || book.estado.nombre,
        }
      }
      
      setShowAdvanceModal(false)
      navigate(`/admin/books/${book.id}`, { state: { book: updatedBook }, replace: true })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al avanzar el estado'
      setAdvanceError(errorMessage)
    } finally {
      setAdvanceLoading(false)
    }
  }

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
          <button
            className="admin-nav-item"
            onClick={() => navigate('/admin/users')}
          >
            Users
          </button>
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

          {/* Tabla de Asignamiento (solo si no está publicado) */}
          {book.estado.id < 7 && canEditBooks && (
            <section className="book-detail-section">
              <h2 className="book-detail-section-title">Asignamiento</h2>
              {currentTask ? (
                <div className="book-detail-table">
                  <div className="book-detail-table-row">
                    <span className="book-detail-table-label">Usuario Asignado:</span>
                    <span className="book-detail-table-value">{currentTask.usuario_nombre}</span>
                  </div>
                  <div className="book-detail-table-row">
                    <span className="book-detail-table-label">Fecha Límite:</span>
                    <span className="book-detail-table-value">
                      {currentTask.fecha_finalizacion ? new Date(currentTask.fecha_finalizacion).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </span>
                  </div>
                  <button className="book-detail-btn" onClick={openAssignModal}>
                    Cambiar Asignación
                  </button>
                </div>
              ) : (
                <div className="book-detail-table">
                  <p className="book-detail-field-value" style={{ marginBottom: '1rem' }}>
                    No hay tarea asignada para este libro.
                  </p>
                  <button className="book-detail-btn" onClick={openAssignModal}>
                    Asignar Usuario
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Tabla de Historia */}
          <section className="book-detail-section">
            <h2 className="book-detail-section-title">Historial de Cambios</h2>
            {historyLoading ? (
              <p className="book-detail-field-value">Cargando historial...</p>
            ) : historyLogs.length > 0 ? (
              <>
                <div className="book-detail-history">
                  {(showAllLogs ? historyLogs : historyLogs.slice(0, 3)).map((log) => (
                    <div key={log.id} className="history-log-item">
                      <div className="history-log-header">
                        <span className="history-log-action">{log.accion}</span>
                        <span className="history-log-date">
                          {new Date(log.fecha).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="history-log-body">
                        <div className="history-log-user-info">
                          <span className="history-log-user">{log.usuario_nombre}</span>
                          {log.usuario_email && (
                            <span className="history-log-email"> ({log.usuario_email})</span>
                          )}
                        </div>
                        {log.target_nombre && (
                          <div className="history-log-target">Libro: {log.target_nombre}</div>
                        )}
                        {log.detalles && Object.keys(log.detalles).length > 0 && (
                          <div className="history-log-details">
                            {log.detalles.campo && (
                              <span className="history-log-detail-item">
                                <strong>Campo modificado:</strong> {log.detalles.campo}
                              </span>
                            )}
                            {log.detalles.valor_anterior && (
                              <span className="history-log-detail-item">
                                <strong>Valor anterior:</strong> {log.detalles.valor_anterior}
                              </span>
                            )}
                            {log.detalles.valor_nuevo && (
                              <span className="history-log-detail-item">
                                <strong>Valor nuevo:</strong> {log.detalles.valor_nuevo}
                              </span>
                            )}
                            {log.detalles.titulo && (
                              <span className="history-log-detail-item">
                                <strong>Título:</strong> {log.detalles.titulo}
                              </span>
                            )}
                            {log.detalles.autor && (
                              <span className="history-log-detail-item">
                                <strong>Autor:</strong> {log.detalles.autor}
                              </span>
                            )}
                            {log.detalles.isbn && (
                              <span className="history-log-detail-item">
                                <strong>ISBN:</strong> {log.detalles.isbn}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {historyLogs.length > 3 && (
                  <button 
                    className="book-detail-btn" 
                    onClick={() => setShowAllLogs(!showAllLogs)}
                    style={{ marginTop: '1rem' }}
                  >
                    {showAllLogs ? 'Ver menos' : `Ver más (${historyLogs.length - 3} registros adicionales)`}
                  </button>
                )}
              </>
            ) : (
              <p className="book-detail-field-value">No hay historial disponible.</p>
            )}
          </section>
        </div>

        {/* Botones flotantes para editar y avanzar (solo Admin y Bibliotecario) */}
        {canEditBooks && (
          <div className="fab-container">
            <button className="fab-button" onClick={openEditModal}>
              Modificar Libro
            </button>
            {book.estado.id < 7 && (
              <button className="fab-button fab-button-secondary" onClick={openAdvanceModal}>
                Avanzar Estado
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modal de edición */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Modificar Libro</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); handleSaveBook(); }}>
              <div className="modal-field">
                <label className="modal-label">Título *</label>
                <input
                  className="modal-input"
                  type="text"
                  value={editForm.titulo}
                  onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Autor *</label>
                <input
                  className="modal-input"
                  type="text"
                  value={editForm.autor}
                  onChange={(e) => setEditForm({ ...editForm, autor: e.target.value })}
                  required
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">ISBN</label>
                <input
                  className="modal-input"
                  type="text"
                  value={editForm.isbn}
                  onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Fecha de Publicación</label>
                <input
                  className="modal-input"
                  type="date"
                  value={editForm.fecha}
                  onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Número de Páginas</label>
                <input
                  className="modal-input"
                  type="number"
                  min="1"
                  value={editForm.numero_paginas}
                  onChange={(e) => setEditForm({ ...editForm, numero_paginas: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Estantería</label>
                <input
                  className="modal-input"
                  type="text"
                  value={editForm.estanteria}
                  onChange={(e) => setEditForm({ ...editForm, estanteria: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Espacio</label>
                <input
                  className="modal-input"
                  type="text"
                  value={editForm.espacio}
                  onChange={(e) => setEditForm({ ...editForm, espacio: e.target.value })}
                />
              </div>

              {editError && <p className="modal-error">{editError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de avanzar estado */}
      {showAdvanceModal && (
        <div className="modal-overlay" onClick={() => setShowAdvanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Avanzar Estado</h2>
              <button className="modal-close" onClick={() => setShowAdvanceModal(false)}>
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); handleAdvanceState(); }}>
              <p style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
                Estado actual: <strong>{book.estado.nombre}</strong>
                <br />
                Siguiente estado: <strong>{stages.find(s => s.id === (book.estado.id + 1) as StageId)?.title || 'N/A'}</strong>
              </p>

              <div className="modal-field">
                <label className="modal-label">Observaciones</label>
                <textarea
                  className="modal-textarea"
                  placeholder="Ingrese observaciones sobre este cambio de estado..."
                  value={advanceForm.observaciones}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, observaciones: e.target.value })}
                />
              </div>

              <div className="modal-checkbox-field">
                <input
                  type="checkbox"
                  id="pasoControlCalidad"
                  className="modal-checkbox"
                  checked={advanceForm.pasoControlCalidad}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, pasoControlCalidad: e.target.checked })}
                />
                <label htmlFor="pasoControlCalidad" className="modal-checkbox-label">
                  Pasó el control de calidad
                </label>
              </div>

              {advanceError && <p className="modal-error">{advanceError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowAdvanceModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-primary"
                  disabled={advanceLoading}
                >
                  {advanceLoading ? 'Avanzando...' : 'Avanzar Estado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de cambiar asignación */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Cambiar Asignación</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); handleSaveAssignment(); }}>
              <div className="modal-field">
                <label className="modal-label">Usuario</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Buscar usuario por nombre..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <div style={{ 
                  maxHeight: '200px', 
                  minHeight: '100px',
                  overflowY: 'auto', 
                  marginTop: '0.5rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.375rem',
                  backgroundColor: '#ffffff'
                }}>
                  {users.length > 0 ? (
                    users
                      .filter(
                        (user: User) =>
                          userSearch === '' ||
                          `${user.nombres} ${user.apellidos}`.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((user: User) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setUserSearch(`${user.nombres} ${user.apellidos}`)
                          }}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            backgroundColor: selectedUserId === user.id ? '#dbeafe' : 'transparent',
                            borderBottom: '1px solid #e5e7eb',
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            {user.nombres} {user.apellidos}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {user.correo_electronico}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100px',
                      color: '#6b7280',
                      fontSize: '0.875rem'
                    }}>
                      {assignError || 'Cargando usuarios...'}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label">Fecha Límite</label>
                <input
                  type="date"
                  className="modal-input"
                  value={maxDate}
                  onChange={(e) => setMaxDate(e.target.value)}
                />
              </div>

              {assignError && <p className="modal-error">{assignError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-primary"
                  disabled={assignLoading}
                >
                  {assignLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
