import '../AdminDashboardPage.css'

type Stage = {
  id: string
  title: string
  count: number
}

type Card = {
  id: string
  title: string
  code: string
  assignee: string
  due: string
  priority: 'High' | 'Medium' | 'Low'
  stageId: string
}

const stages: Stage[] = [
  { id: 'reception', title: 'In Reception', count: 2 },
  { id: 'review', title: 'In Review', count: 3 },
  { id: 'restoration', title: 'Restoration', count: 2 },
  { id: 'digitization', title: 'Digitization', count: 2 },
  { id: 'classification', title: 'Classification', count: 2 },
  { id: 'published', title: 'Published', count: 1 },
]

const cards: Card[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    code: 'BK-2024-001',
    assignee: 'Alice Johnson',
    due: '2025-11-12',
    priority: 'High',
    stageId: 'reception',
  },
  {
    id: '2',
    title: '1984',
    code: 'BK-2024-003',
    assignee: 'Bob Smith',
    due: '2025-11-12',
    priority: 'High',
    stageId: 'review',
  },
  {
    id: '3',
    title: 'War and Peace',
    code: 'BK-2024-006',
    assignee: 'Emma Davis',
    due: '2025-11-14',
    priority: 'High',
    stageId: 'restoration',
  },
  {
    id: '4',
    title: 'Hamlet',
    code: 'BK-2024-008',
    assignee: 'Grace Wilson',
    due: '2025-11-16',
    priority: 'Low',
    stageId: 'digitization',
  },
  {
    id: '5',
    title: 'Crime and Punishment',
    code: 'BK-2024-010',
    assignee: 'Irene Moore',
    due: '2025-11-17',
    priority: 'High',
    stageId: 'classification',
  },
  {
    id: '6',
    title: 'Moby Dick',
    code: 'BK-2024-012',
    assignee: 'Kate Robinson',
    due: '2025-11-18',
    priority: 'Medium',
    stageId: 'published',
  },
]

export default function AdminDashboardPage() {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-icon">📚</div>
          <span className="admin-logo-text">ArchiveFlow</span>
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
            <div className="admin-user-chip">
              <span className="admin-user-avatar">AJ</span>
              <span className="admin-user-status" />
            </div>
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
          {stages.map((stage) => (
            <div key={stage.id} className="admin-column">
              <header className="admin-column-header">
                <span className="admin-column-title">{stage.title}</span>
                <span className="admin-column-count">{stage.count}</span>
              </header>

              <div className="admin-column-body">
                {cards
                  .filter((card) => card.stageId === stage.id)
                  .map((card) => (
                    <article key={card.id} className="admin-card">
                      <div className="admin-card-header">
                        <span className="admin-card-title">{card.title}</span>
                        <span
                          className={`admin-card-badge admin-card-badge-${card.priority.toLowerCase()}`}
                        >
                          {card.priority}
                        </span>
                      </div>
                      <p className="admin-card-code">{card.code}</p>
                      <div className="admin-card-footer">
                        <div className="admin-card-assignee">
                          <span className="admin-assignee-avatar">
                            {card.assignee
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                          <span className="admin-assignee-name">
                            {card.assignee}
                          </span>
                        </div>
                        <div className="admin-card-due">
                          <span className="admin-card-due-date">{card.due}</span>
                          <span className="admin-card-due-label">Overdue</span>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
