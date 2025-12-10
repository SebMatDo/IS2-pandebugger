import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiPut } from '../api/client'
import '../AdminUsersPage.css'
import '../AdminDashboardPage.css'

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

type RoleFromApi = {
  id: number
  nombre: string
  descripcion?: string
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


const FALLBACK_ROLES: RoleFromApi[] = [
  { id: 1, nombre: 'Admin' },
  { id: 2, nombre: 'Bibliotecario' },
  { id: 3, nombre: 'Digitalizador' },
  { id: 4, nombre: 'Revisor' },
  { id: 5, nombre: 'Restaurador' },
]

function getInitialsFromFullName(fullName: string) {
  const parts = fullName.split(' ').filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'U'
}

function mapUserToRow(u: UserFromApi, tasksCount = 0): UserRow {
  const fullName = `${u.nombres} ${u.apellidos}`.trim()
  const initials = getInitialsFromFullName(fullName)

  return {
    id: u.id,
    fullName,
    initials,
    email: u.correo_electronico,
    roleName: u.rol?.nombre ?? '—',
    tasks: tasksCount,
    isActive: Boolean(u.estado),
  }
}

function extractArrayFromApiResponse(res: any): any[] {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (res.status === 'success' && Array.isArray(res.data)) return res.data
  if (res.success === true && Array.isArray(res.data)) return res.data
  if (Array.isArray(res.data)) return res.data
  if (res.data?.records && Array.isArray(res.data.records)) return res.data.records
  return []
}

export default function AdminUsersPage() {
  const navigate = useNavigate()

  // Guardamos raw users para editar con rol.id real
  const [usersRaw, setUsersRaw] = useState<UserFromApi[]>([])

  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // =========================
  // Roles
  // =========================
  const [roles, setRoles] = useState<RoleFromApi[]>([])
  const combinedRoles = useMemo(
    () => (roles.length > 0 ? roles : FALLBACK_ROLES),
    [roles]
  )

  // =========================
  // Modal Create User
  // =========================
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    contraseña: '',
    rol_id: '' as string | number,
    estado: true,
  })

  // =========================
  // Modal Edit User
  // =========================
  const [showEditModal, setShowEditModal] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)

  const [editForm, setEditForm] = useState({
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    // contraseña opcional para reset rápido (si tu UpdateUserDto la permite)
    contraseña: '',
    rol_id: '' as string | number,
    estado: true,
  })

  // =========================
  // Current authenticated user (para cambio de contraseña)
  // =========================
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [, setCurrentUserEmail] = useState<string | null>(null)

  // Modal Change Password
  const [showChangePassModal, setShowChangePassModal] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [passSuccess, setPassSuccess] = useState<string | null>(null)

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  // =========================
  // Cargar roles desde BD
  // (tu controller expone GET /api/v1/users/roles)
  // =========================
  useEffect(() => {
    async function loadRoles() {
      try {
        // 👇 importante: según tu controller
        const res = await apiGet<any>('/users/roles')

        const data = extractArrayFromApiResponse(res)

        const mapped = data
          .filter((r: any) => r && r.id && r.nombre)
          .map((r: any) => ({
            id: r.id,
            nombre: r.nombre,
            descripcion: r.descripcion,
          }))

        setRoles(mapped)
      } catch {
        setRoles([])
      }
    }

    loadRoles()
  }, [])

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await apiGet<any>('/auth/me')
        const me = res?.data ?? res

        // tolerante a estructuras distintas
        if (me?.id) setCurrentUserId(me.id)
        if (me?.correo_electronico) setCurrentUserEmail(me.correo_electronico)
        else if (me?.email) setCurrentUserEmail(me.email)
      } catch {
        setCurrentUserId(null)
        setCurrentUserEmail(null)
      }
    }

    loadMe()
  }, [])


  // =========================
  // Task counts reales
  // =========================
  const fetchTaskCount = useCallback(async (userId: number) => {
    try {
      const res = await apiGet<any>(`/tasks?usuario_id=${userId}`)
      const tasksArr = extractArrayFromApiResponse(res)
      return tasksArr.length
    } catch {
      return 0
    }
  }, [])

  // =========================
  // Cargar usuarios + conteo de tareas
  // =========================
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await apiGet<any>('/users')

      // Tu controller devuelve createSuccessResponse(users)
      // que normalmente es { status:'success', data:[...] }
      const usersData = extractArrayFromApiResponse(res) as UserFromApi[]

      if (!Array.isArray(usersData)) {
        throw new Error('Error al cargar usuarios')
      }

      setUsersRaw(usersData)

      // Conteo real de tareas por usuario
      const counts = await Promise.all(
        usersData.map((u) => fetchTaskCount(u.id))
      )

      const mappedRows = usersData.map((u, idx) =>
        mapUserToRow(u, counts[idx] ?? 0)
      )

      setRows(mappedRows)
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [fetchTaskCount])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // =========================
  // Abrir modal Create
  // =========================
  const openCreateModal = () => {
    setCreateError(null)
    const defaultRoleId = combinedRoles[0]?.id ?? ''

    setCreateForm({
      nombres: '',
      apellidos: '',
      correo_electronico: '',
      contraseña: '',
      rol_id: defaultRoleId,
      estado: true,
    })

    setShowCreateModal(true)
  }

  // =========================
  // Crear usuario
  // =========================
  const handleCreateUser = async () => {
    setCreateError(null)

    if (!createForm.nombres.trim()) return setCreateError('El nombre es obligatorio')
    if (!createForm.apellidos.trim()) return setCreateError('Los apellidos son obligatorios')
    if (!createForm.correo_electronico.trim()) return setCreateError('El correo es obligatorio')
    if (!createForm.contraseña.trim()) return setCreateError('La contraseña es obligatoria')
    if (!createForm.rol_id) return setCreateError('Debe seleccionar un rol')

    setCreateLoading(true)

    try {
      const payload = {
        nombres: createForm.nombres.trim(),
        apellidos: createForm.apellidos.trim(),
        correo_electronico: createForm.correo_electronico.trim(),
        contraseña: createForm.contraseña,
        rol_id: Number(createForm.rol_id),
        estado: Boolean(createForm.estado),
      }

      const res = await apiPost<any>('/users', payload)

      const ok =
        res?.status === 'success' ||
        res?.success === true ||
        Boolean(res?.data)

      if (!ok) throw new Error('No se pudo crear el usuario')

      setShowCreateModal(false)
      await loadUsers()
    } catch (err: any) {
      console.error(err)
      setCreateError(err.message ?? 'Error al crear usuario')
    } finally {
      setCreateLoading(false)
    }
  }

  // =========================
  // Abrir modal Edit
  // =========================
  const openEditModal = (row: UserRow) => {
    const raw = usersRaw.find((u) => u.id === row.id)

    const roleId = raw?.rol?.id ?? combinedRoles[0]?.id ?? ''

    setEditingUserId(row.id)
    setEditError(null)

    setEditForm({
      nombres: raw?.nombres ?? row.fullName.split(' ')[0] ?? '',
      apellidos:
        raw?.apellidos ??
        row.fullName.split(' ').slice(1).join(' ') ??
        '',
      correo_electronico: raw?.correo_electronico ?? row.email ?? '',
      contraseña: '', // opcional
      rol_id: roleId,
      estado: raw?.estado ?? row.isActive ?? true,
    })

    setShowEditModal(true)
  }

  // =========================
  // Guardar Edit
  // =========================
  const handleSaveEdit = async () => {
    setEditError(null)
    if (!editingUserId) return

    if (!editForm.nombres.trim()) return setEditError('El nombre es obligatorio')
    if (!editForm.apellidos.trim()) return setEditError('Los apellidos son obligatorios')
    if (!editForm.correo_electronico.trim()) return setEditError('El correo es obligatorio')
    if (!editForm.rol_id) return setEditError('Debe seleccionar un rol')

    setEditLoading(true)

    try {
      // UpdateUserDto típico: campos opcionales
      const payload: any = {
        nombres: editForm.nombres.trim(),
        apellidos: editForm.apellidos.trim(),
        correo_electronico: editForm.correo_electronico.trim(),
        rol_id: Number(editForm.rol_id),
        estado: Boolean(editForm.estado),
      }

      // solo enviar contraseña si el admin la escribió
      if (editForm.contraseña.trim()) {
        payload.contraseña = editForm.contraseña
      }

      const res = await apiPut<any>(`/users/${editingUserId}`, payload)

      const ok =
        res?.status === 'success' ||
        res?.success === true ||
        Boolean(res?.data)

      if (!ok) throw new Error('No se pudo actualizar el usuario')

      setShowEditModal(false)
      setEditingUserId(null)
      await loadUsers()
    } catch (err: any) {
      console.error(err)
      setEditError(err.message ?? 'Error al actualizar usuario')
    } finally {
      setEditLoading(false)
    }
  }

  // =========================
  // Deactivate / Activate REAL
  // Usamos PUT con estado para no depender de apiDelete/apiPatch.
  // =========================
  const handleToggleStatus = async (row: UserRow) => {
    try {
      const newEstado = !row.isActive

      const res = await apiPut<any>(`/users/${row.id}`, {
        estado: newEstado,
      })

      const ok =
        res?.status === 'success' ||
        res?.success === true ||
        Boolean(res?.data)

      if (!ok) throw new Error('No se pudo cambiar el estado del usuario')

      await loadUsers()
    } catch (err) {
      console.error(err)
      // opcional: podrías mostrar un toast o setear error global
    }
  }

  // =========================
  // Reset password rápido (opcional)
  // Aquí solo abrimos el edit modal y el admin escribe nueva contraseña
  // =========================

  // =========================
  // Filtros
  // =========================
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

    const openChangePasswordForRow = (row: UserRow) => {
    setPassError(null)
    setPassSuccess(null)

    if (row.id) {}

    setPassForm({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    })

    setShowChangePassModal(true)
  }

  const handleChangePassword = async () => {
    setPassError(null)
    setPassSuccess(null)

    if (!passForm.currentPassword.trim()) {
      setPassError('Debes ingresar tu contraseña actual.')
      return
    }
    if (!passForm.newPassword.trim()) {
      setPassError('Debes ingresar tu nueva contraseña.')
      return
    }
    if (passForm.newPassword !== passForm.confirmNewPassword) {
      setPassError('La confirmación no coincide con la nueva contraseña.')
      return
    }

    setPassLoading(true)
    try {
      const res = await apiPost<any>('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      })

      const ok =
        res?.status === 'success' ||
        res?.success === true

      if (!ok) throw new Error('No se pudo cambiar la contraseña.')

      setPassSuccess('Contraseña actualizada correctamente.')
      setPassForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })

    } catch (err: any) {
      setPassError(err.message ?? 'Error al cambiar contraseña.')
    } finally {
      setPassLoading(false)
    }
  }


  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-icon" />
          <span className="admin-logo-text">Workflow</span>
        </div>

        <nav className="admin-sidebar-nav">
          <button className="admin-nav-item" onClick={() => navigate('/admin')}>
            Dashboard
          </button>
          <button
            className="admin-nav-item"
            onClick={() => navigate('/admin/books')}
          >
            Books
          </button>
          <button
            className="admin-nav-item"
            onClick={() => navigate('/admin/assignments')}
          >
            Assignments
          </button>
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
            <button
              className="admin-primary-button"
              onClick={openCreateModal}
            >
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
                    <th >User</th>
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
                            onClick={() => openEditModal(row)}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="admin-users-action-btn"
                            onClick={() => openChangePasswordForRow(row)}
                            title={
                              currentUserId && row.id === currentUserId
                                ? 'Change your password'
                                : 'Change their password'
                            }
                          >
                            🔑
                          </button>

                          <button
                            type="button"
                            className="admin-users-action-btn"
                            title={row.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => handleToggleStatus(row)}
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
          </section>
        )}
      </main>

      {/* =========================
          Modal Create User
          ========================= */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 720 }}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Create New User</h2>
                <p className="admin-subtitle" style={{ marginTop: 6 }}>
                  Add a new team member to the workflow
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form
              className="modal-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateUser()
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div className="modal-field">
                  <label className="modal-label">First name(s) *</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter first name(s)"
                    value={createForm.nombres}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, nombres: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Last name(s) *</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter last name(s)"
                    value={createForm.apellidos}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, apellidos: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="modal-label">Email *</label>
                  <input
                    className="modal-input"
                    type="email"
                    placeholder="user@example.com"
                    value={createForm.correo_electronico}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        correo_electronico: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="modal-label">Password *</label>
                  <input
                    className="modal-input"
                    type="password"
                    placeholder="Enter a secure password"
                    value={createForm.contraseña}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        contraseña: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Role *</label>
                  <select
                    className="modal-input"
                    value={createForm.rol_id}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        rol_id: Number(e.target.value),
                      })
                    }
                  >
                    {combinedRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Status</label>
                  <select
                    className="modal-input"
                    value={createForm.estado ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        estado: e.target.value === 'active',
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {createError && <p className="modal-error">{createError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          Modal Edit User
          ========================= */}
      {showEditModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 720 }}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Edit User</h2>
                <p className="admin-subtitle" style={{ marginTop: 6 }}>
                  Update user information, role, or status
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form
              className="modal-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveEdit()
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div className="modal-field">
                  <label className="modal-label">First name(s) *</label>
                  <input
                    className="modal-input"
                    type="text"
                    value={editForm.nombres}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nombres: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Last name(s) *</label>
                  <input
                    className="modal-input"
                    type="text"
                    value={editForm.apellidos}
                    onChange={(e) =>
                      setEditForm({ ...editForm, apellidos: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="modal-label">Email *</label>
                  <input
                    className="modal-input"
                    type="email"
                    value={editForm.correo_electronico}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        correo_electronico: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Role *</label>
                  <select
                    className="modal-input"
                    value={editForm.rol_id}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        rol_id: Number(e.target.value),
                      })
                    }
                  >
                    {combinedRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Status</label>
                  <select
                    className="modal-input"
                    value={editForm.estado ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        estado: e.target.value === 'active',
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {editError && <p className="modal-error">{editError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          Modal Change Password
          ========================= */}
      {showChangePassModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowChangePassModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560 }}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Change Password</h2>
                <p className="admin-subtitle" style={{ marginTop: 6 }}>
                  This action updates the password
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowChangePassModal(false)}
              >
                ×
              </button>
            </div>

            <form
              className="modal-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleChangePassword()
              }}
            >
              <div className="modal-field">
                <label className="modal-label">Current password *</label>
                <input
                  className="modal-input"
                  type="password"
                  value={passForm.currentPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, currentPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">New password *</label>
                <input
                  className="modal-input"
                  type="password"
                  value={passForm.newPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, newPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Confirm new password *</label>
                <input
                  className="modal-input"
                  type="password"
                  value={passForm.confirmNewPassword}
                  onChange={(e) =>
                    setPassForm({
                      ...passForm,
                      confirmNewPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {passError && <p className="modal-error">{passError}</p>}
              {passSuccess && (
                <p style={{ color: 'green', marginTop: 8 }}>{passSuccess}</p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowChangePassModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-primary"
                  disabled={passLoading}
                >
                  {passLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
