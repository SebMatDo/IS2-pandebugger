import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookCard from '../components/BookCard'
import { apiGet, apiPost } from '../api/client'

type ApiBook = {
  id: number
  isbn: string | null
  titulo: string
  autor: string
  fecha: string
  numero_paginas: number | null
  estado: {
    id: 1 | 2 | 3 | 4 | 5 | 6 | 7
    nombre: string
    descripcion?: string | null
  }
  categoria?: {
    nombre: string
    descripcion?: string | null
  }
  directorio_pdf?: string | null
}

type Book = {
  id: number
  title: string
  author: string
  year: number | null
  coverUrl: string
}

type LoginResponse = {
  status: string
  data: {
    user: {
      id: number
      nombres: string
      apellidos: string
      correo_electronico: string
      rol: {
        id: number
        nombre: string
      }
    }
    token: string
    expiresIn: string
  }
  message: string
  timestamp: string
}

export default function ReaderPortalPage() {
  const navigate = useNavigate()

  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('userRoleId') //CAMBIADO
  })

  const [userRoleId, setUserRoleId] = useState<number | null>(() => {
    const raw = localStorage.getItem('userRoleId')
    return raw ? Number(raw) : null
  })

  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('admin@pandebugger.com') // por ahora para probar
  const [password, setPassword] = useState('Test123!')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)


async function AnonymousToken(): Promise<string> {
    let token = localStorage.getItem('token')
    if (token) return token

    const res = await apiPost<LoginResponse>('/auth/login-anonymous', {})
    token = res.data?.token

    if (!token) {
      throw new Error('No se recibió token del login anónimo')
    }

    localStorage.setItem('token', token)
    return token
  }
  
  async function loadBooks() {
    try {
      setLoading(true)
      setError(null)

      await AnonymousToken()

      const res = await apiGet<{ success: boolean; data: ApiBook[] }>('/books')

      if (!res.success) {
        throw new Error('Error al cargar libros')
      }

      const published = res.data.filter(
        (b) => b.estado.id === 7
      )

      const mapped: Book[] = published.map((b) => {
        let year: number | null = null
        if (b.fecha) {
          const d = new Date(b.fecha)
          if (!isNaN(d.getTime())) {
            year = d.getFullYear()
          }
        }

        return {
          id: b.id,
          title: b.titulo,
          author: b.autor,
          year,
          coverUrl: 'https://via.placeholder.com/240x320?text=Libro',
        }
      })

      setBooks(mapped)
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? 'Error al cargar libros')
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
  }, [])


async function handleLogin(e: FormEvent) {
  e.preventDefault()
  setLoginLoading(true)
  setLoginError(null)

  try {
    const res = await apiPost<LoginResponse>('/auth/login', { email, password })

    console.log('LOGIN RESPONSE ->', res)

    const token = res.data?.token
    const roleId = res.data?.user?.rol?.id ?? null

    if (!token) {
      throw new Error('Credenciales inválidas')
    }

    // guardar token
    localStorage.setItem('token', token)
    setIsAuthenticated(true)

    // guardar roleId (1..6)
    if (roleId !== null) {
      localStorage.setItem('userRoleId', String(roleId))
      setUserRoleId(roleId)
    } else {
      localStorage.removeItem('userRoleId')
      setUserRoleId(null)
    }

    setShowLogin(false)
    await loadBooks()
  } catch (err: any) {
    console.error(err)
    setLoginError(err.message ?? 'Error al iniciar sesión')
  } finally {
    setLoginLoading(false)
  }
}

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userRoleId')
    setIsAuthenticated(false)
    setUserRoleId(null)
    setError(null)
  }


  const canSeeAdminButton =
    isAuthenticated &&
    userRoleId !== null &&
    userRoleId >= 1 &&
    userRoleId <= 5

  return (
    <div className="reader-layout">
      {/* Barra superior */}
      <header className="reader-navbar">
        <div className="reader-navbar-left">
          <span className="reader-logo">Digital Library Pandebugger</span>

          {canSeeAdminButton && (
          <button
            className="reader-admin-link"
            onClick={() => navigate('/admin')}
          >
            Admin Dashboard
          </button>
          )}

        </div>
        <div className="reader-navbar-right">
          <button className="reader-nav-link reader-nav-link-active">Home</button>
          <button className="reader-nav-link">Browse by Category</button>

          {isAuthenticated ? (
            <button className="reader-login-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          ) : (
            <button className="reader-login-button" onClick={() => setShowLogin(true)}>
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      {/* Hero / buscador */}
      <main className="reader-main">
        <section className="reader-hero">
          <h1 className="reader-hero-title">Explore our Digital Archive</h1>
          <p className="reader-hero-subtitle">
            Search through hundreds of digital books from our collection
          </p>

          <form
            className="reader-search-bar"
            onSubmit={(e) => {
              e.preventDefault()
              // luego conectamos con búsqueda real
            }}
          >
            <input
              type="text"
              placeholder="Search by title, author, or keyword…"
              className="reader-search-input"
            />
            <button type="submit" className="reader-search-button">
              Search
            </button>
          </form>
        </section>

        {/* Grid de libros */}
        <section className="reader-books-section">
          <h2 className="reader-section-title">Recently Published</h2>

          {loading && <p>Cargando libros…</p>}
          {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

          {!loading && !error && books.length > 0 && (
            <div className="reader-books-grid">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}

          {!loading && !error && books.length === 0 && (
            <p>No hay libros publicados todavía.</p>
          )}

        </section>
      </main>

      {/* Modal de login */}
      {showLogin && (
        <div className="login-modal-backdrop" onClick={() => !loginLoading && setShowLogin(false)}>
          <div
            className="login-modal"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <h2 className="login-title">Iniciar sesión</h2>
            <p className="login-subtitle">
              Utiliza las credenciales autorizadas
              <br />
              <code>admin@pandebugger.com / Test123!</code>
            </p>

            <form className="login-form" onSubmit={handleLogin}>
              <label className="login-label">
                Email
                <input
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="login-label">
                Contraseña
                <input
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {loginError && <p className="login-error">{loginError}</p>}

              <div className="login-actions">
                <button
                  type="button"
                  className="login-cancel"
                  onClick={() => setShowLogin(false)}
                  disabled={loginLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="login-submit" disabled={loginLoading}>
                  {loginLoading ? 'Ingresando…' : 'Entrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
