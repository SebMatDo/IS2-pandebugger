import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api/client";
import "../AdminDashboardPage.css";
import "../AdminAssignmentsPage.css";

type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Stage = {
  id: StageId;
  title: string;
};

const stages: Stage[] = [
  { id: 1, title: "In Reception" },
  { id: 2, title: "In Review" },
  { id: 3, title: "Restoration" },
  { id: 4, title: "Digitization" },
  { id: 5, title: "Quality Control" },
  { id: 6, title: "Classification" },
  { id: 7, title: "Published" },
];

type BookFromApi = {
  id: number;
  titulo: string;
  autor: string;
  isbn: string | null;
  fecha: string | null;
  estado?: {
    id: StageId;
    nombre: string;
    descripcion?: string | null;
  };
};

// Igual a AdminUsersPage
type UserFromApi = {
  id: number;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  rol: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  estado: boolean;
};

// Lo que se ve en BookDetail (flexible)
type TaskFromApi = {
  id: number;
  libro_id: number;
  usuario_id: number;
  fecha_finalizacion?: string | null;
  fecha_asignacion?: string | null;
  estado_nuevo_id?: number;

  // a veces el backend puede mandar usuario embebido
  usuario?: {
    id: number;
    nombres: string;
    apellidos: string;
    correo_electronico?: string;
  };
};

type UserUI = {
  id: number;
  name: string;
  role: string;
  capacity: number;
  isActive: boolean;
};

type AssignedBookUI = {
  id: number;
  title: string;
  code: string;
  stageId: StageId;
  stageName: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function normalizeUser(u: UserFromApi): UserUI {
  const fullName = `${u.nombres ?? ""} ${u.apellidos ?? ""}`.trim() || "User";
  const role = u.rol?.nombre ?? "Member";
  const capacity = 5;

  return {
    id: u.id,
    name: fullName,
    role,
    capacity,
    isActive: Boolean(u.estado),
  };
}

// Extraer data robustamente como en BookDetail
function extractTasksArray(response: any): TaskFromApi[] {
  if (!response) return [];

  if (response.status === "success" && Array.isArray(response.data)) {
    return response.data;
  }
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

// Seleccionar tarea "actual" por libro
function pickCurrentTask(tasks: TaskFromApi[]): TaskFromApi | null {
  if (!tasks.length) return null;

  // Regla simple: la de id más alto
  // (ajústalo si tienes created_at real)
  return [...tasks].sort((a, b) => b.id - a.id)[0];
}

export default function AdminAssignmentsPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"user" | "stage">("user");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [books, setBooks] = useState<BookFromApi[]>([]);
  const [users, setUsers] = useState<UserUI[]>([]);
  const [tasks, setTasks] = useState<TaskFromApi[]>([]);

  const [search] = useState("");
  const [userFilter, setUserFilter] = useState<number | "all">("all");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 1) Libros
        const booksRes = await apiGet<{ success: boolean; data: BookFromApi[] }>(
          "/books"
        );
        if (!booksRes.success) throw new Error("Error al cargar libros");
        setBooks(booksRes.data ?? []);

        // 2) Usuarios
        const usersRes = await apiGet<{ status: string; data: UserFromApi[] }>(
          "/users"
        );
        if (usersRes.status !== "success" || !Array.isArray(usersRes.data)) {
          throw new Error("Error al cargar usuarios");
        }
        setUsers(usersRes.data.map(normalizeUser));

        // 3) Tareas
        const tasksRes = await apiGet<any>("/tasks");
        const tasksData = extractTasksArray(tasksRes);
        setTasks(tasksData);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Mapear libros a UI
  const mappedBooks: AssignedBookUI[] = useMemo(() => {
    return books.map((b) => ({
      id: b.id,
      title: b.titulo,
      code: b.isbn || `BK-${String(b.id).padStart(3, "0")}`,
      stageId: b.estado?.id ?? 1,
      stageName: b.estado?.nombre ?? "Sin estado",
    }));
  }, [books]);

  // Mapa libro_id -> tarea actual
  const taskByBookId = useMemo(() => {
    const bucket = new Map<number, TaskFromApi[]>();

    for (const t of tasks) {
      if (!bucket.has(t.libro_id)) bucket.set(t.libro_id, []);
      bucket.get(t.libro_id)!.push(t);
    }

    const current = new Map<number, TaskFromApi>();
    for (const [bookId, list] of bucket.entries()) {
      const ct = pickCurrentTask(list);
      if (ct) current.set(bookId, ct);
    }

    return current;
  }, [tasks]);

  // Agrupar libros por usuario con base en tasks
  const assignmentsByUser = useMemo(() => {
    const map = new Map<number, { user: UserUI; books: AssignedBookUI[] }>();

    for (const u of users) {
      map.set(u.id, { user: u, books: [] });
    }

    for (const b of books) {
      const task = taskByBookId.get(b.id);
      if (!task) continue;

      const user = users.find((u) => u.id === task.usuario_id);
      if (!user) continue;

      const uiBook: AssignedBookUI = {
        id: b.id,
        title: b.titulo,
        code: b.isbn || `BK-${String(b.id).padStart(3, "0")}`,
        stageId: b.estado?.id ?? 1,
        stageName: b.estado?.nombre ?? "Sin estado",
      };

      map.get(user.id)?.books.push(uiBook);
    }

    return Array.from(map.values());
  }, [users, books, taskByBookId]);

  // Filtro de búsqueda y dropdown
  const filteredAssignmentsByUser = useMemo(() => {
    const q = search.trim().toLowerCase();

    return assignmentsByUser
      .filter((row) => (userFilter === "all" ? true : row.user.id === userFilter))
      .filter((row) => {
        if (!q) return true;

        const userMatch = row.user.name.toLowerCase().includes(q);
        const bookMatch = row.books.some(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.code.toLowerCase().includes(q)
        );

        return userMatch || bookMatch;
      })
      .map((row) => ({
        ...row,
        books: row.books.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  }, [assignmentsByUser, search, userFilter]);

  // Vista por etapas usando tasks para top assignees
  const assignmentsByStage = useMemo(() => {
    return stages.map((s) => {
      const booksInStage = mappedBooks.filter((b) => b.stageId === s.id);

      const counter = new Map<string, number>();

      for (const b of books.filter((bk) => (bk.estado?.id ?? 1) === s.id)) {
        const task = taskByBookId.get(b.id);
        if (!task) continue;

        const user =
          users.find((u) => u.id === task.usuario_id) ||
          null;

        const name =
          user?.name ||
          (task.usuario
            ? `${task.usuario.nombres} ${task.usuario.apellidos}`.trim()
            : "Sin asignar");

        if (name !== "Sin asignar") {
          counter.set(name, (counter.get(name) ?? 0) + 1);
        }
      }

      const topAssignees = Array.from(counter.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      return {
        stage: s,
        total: booksInStage.length,
        topAssignees,
      };
    });
  }, [mappedBooks, books, taskByBookId, users]);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-icon"></div>
          <span className="admin-logo-text">Workflow</span>
        </div>

        <nav className="admin-sidebar-nav">
          <button className="admin-nav-item" onClick={() => navigate("/admin")}>
            Dashboard
          </button>
          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin/books")}
          >
            Books
          </button>
          <button
            className="admin-nav-item admin-nav-item-active"
            onClick={() => navigate("/admin/assignments")}
          >
            Assignments
          </button>
          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin/users")}
          >
            Users
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {loading && <p>Cargando asignaciones…</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <header className="admin-topbar">
          <div>
            <h1 className="admin-title">Assignment & Availability</h1>
            <p className="admin-subtitle">
              Manage task assignments and team capacity
            </p>
          </div>
        </header>

        <section className="assignments-controls">
          <div className="assignments-toggle">
            <button
              className={`assignments-pill ${mode === "stage" ? "active" : ""}`}
              onClick={() => setMode("stage")}
            >
              By Stage
            </button>
            <button
              className={`assignments-pill ${mode === "user" ? "active" : ""}`}
              onClick={() => setMode("user")}
            >
              By User
            </button>
          </div>

          <div className="assignments-right">
            <select
              className="assignments-select"
              value={userFilter}
              onChange={(e) => {
                const v = e.target.value;
                setUserFilter(v === "all" ? "all" : Number(v));
              }}
              disabled={mode === "stage"}
              title={mode === "stage" ? "Available in By User view" : undefined}
            >
              <option value="all">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {mode === "user" ? (
          <section className="assignments-users-list">
            {filteredAssignmentsByUser.length === 0 && !loading && (
              <div className="assignments-empty">
                No assignments to display.
              </div>
            )}

            {filteredAssignmentsByUser.map(({ user, books }) => {
              const workload = books.length;
              const capacity = user.capacity ?? 5;
              const ratio = Math.min(workload, capacity);

              const status =
                workload === 0
                  ? "available"
                  : workload < capacity
                  ? "available"
                  : "busy";

              return (
                <article key={user.id} className="assignments-user-card">
                  <div className="assignments-user-header">
                    <div className="assignments-user-left">
                      <div className="assignments-avatar">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div className="assignments-user-name">{user.name}</div>
                        <div className="assignments-user-role">{user.role}</div>
                      </div>
                    </div>

                    <div className="assignments-user-right">
                      <span className={`assignments-status-badge ${status}`}>
                        {status}
                      </span>

                      <div className="assignments-workload">
                        <span className="assignments-workload-label">
                          Workload
                        </span>
                        <span className="assignments-workload-value">
                          {ratio}/{capacity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="assignments-user-books">
                    {books.length === 0 ? (
                      <div className="assignments-user-books-empty">
                        No assigned books
                      </div>
                    ) : (
                      books.map((b) => (
                        <button
                          key={b.id}
                          className="assignments-book-tile"
                          onClick={() =>
                            navigate(`/admin/books/${b.id}`, {
                              state: { bookId: b.id },
                            })
                          }
                          type="button"
                        >
                          <div className="assignments-book-title">{b.title}</div>
                          <div className="assignments-book-code">{b.code}</div>
                        </button>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="assignments-stages-list">
            {assignmentsByStage.map((row) => (
              <article key={row.stage.id} className="assignments-stage-card">
                <div className="assignments-stage-header">
                  <div className="assignments-stage-title">
                    {row.stage.title}
                  </div>
                  <div className="assignments-stage-total">
                    {row.total} items
                  </div>
                </div>

                <div className="assignments-stage-sub">
                  <span className="assignments-stage-sub-label">
                    Top assignees
                  </span>

                  <div className="assignments-stage-assignees">
                    {row.topAssignees.length === 0 ? (
                      <span className="assignments-muted">No data</span>
                    ) : (
                      row.topAssignees.map(([name, count]) => (
                        <span
                          key={`${row.stage.id}-${name}`}
                          className="assignments-stage-chip"
                          title={`${count} tasks`}
                        >
                          {name} · {count}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
