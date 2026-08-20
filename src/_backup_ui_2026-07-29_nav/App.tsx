import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  analyzeProject,
  fixtureFileUrl,
  getWorkspace,
  listProjects,
  uploadClaim,
  valuationDownloadUrl,
  type ProjectInfo,
  type ValuationResult,
  type Workspace,
} from './api'
import AgentPanel from './components/AgentPanel'
import { t, type Locale, type MsgKey } from './i18n'
import { API_BASE } from './config'

type Page =
  | 'dashboard'
  | 'projects'
  | 'contract'
  | 'valuation'
  | 'evidence'
  | 'cpecs'
  | 'market'
  | 'intel'
  | 'deadlines'
  | 'reports'
  | 'audit'
  | 'settings'

type NavGroup = { group: MsgKey; items: { id: Page; label: MsgKey; icon: string }[] }

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'nav_group_overview',
    items: [
      { id: 'dashboard', label: 'nav_dashboard', icon: 'home' },
      { id: 'projects', label: 'nav_projects', icon: 'folder' },
    ],
  },
  {
    group: 'nav_group_valuation',
    items: [
      { id: 'valuation', label: 'nav_valuation', icon: 'calc' },
      { id: 'evidence', label: 'nav_evidence', icon: 'file' },
      { id: 'cpecs', label: 'nav_cpecs', icon: 'scan' },
      { id: 'market', label: 'nav_market', icon: 'chart' },
    ],
  },
  {
    group: 'nav_group_contract',
    items: [
      { id: 'contract', label: 'nav_contract', icon: 'doc' },
      { id: 'intel', label: 'nav_intel', icon: 'book' },
      { id: 'deadlines', label: 'nav_deadlines', icon: 'clock' },
    ],
  },
  {
    group: 'nav_group_outputs',
    items: [
      { id: 'reports', label: 'nav_reports', icon: 'report' },
      { id: 'audit', label: 'nav_audit', icon: 'list' },
    ],
  },
  {
    group: 'nav_group_system',
    items: [{ id: 'settings', label: 'nav_settings', icon: 'gear' }],
  },
]

const NAV_FLAT = NAV_GROUPS.flatMap((g) => g.items)

function NavIcon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M6 10.5V20h12v-9.5" />
        </svg>
      )
    case 'folder':
      return (
        <svg {...common}>
          <path d="M3 7.5h6l2 2H21v10H3z" />
          <path d="M3 7.5V5.5h5l2 2" />
        </svg>
      )
    case 'calc':
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 8h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0" />
        </svg>
      )
    case 'file':
      return (
        <svg {...common}>
          <path d="M8 3h6l4 4v14H8z" />
          <path d="M14 3v4h4" />
        </svg>
      )
    case 'scan':
      return (
        <svg {...common}>
          <path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3M8 12h8" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19h16M7 16V10M12 16V6M17 16v-4" />
        </svg>
      )
    case 'doc':
      return (
        <svg {...common}>
          <path d="M7 3h8l4 4v14H7z" />
          <path d="M15 3v4h4M10 12h6M10 16h6" />
        </svg>
      )
    case 'book':
      return (
        <svg {...common}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
          <path d="M5 5.5V21.5" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </svg>
      )
    case 'report':
      return (
        <svg {...common}>
          <path d="M6 3h9l4 4v14H6z" />
          <path d="M15 3v4h4M9 13h7M9 17h5" />
        </svg>
      )
    case 'list':
      return (
        <svg {...common}>
          <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
        </svg>
      )
  }
}

function money(n: number, currency = 'HKD') {
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function statusLabel(locale: Locale, status: string) {
  if (status === 'completed') return t(locale, 'completed')
  if (status === 'open') return t(locale, 'open')
  if (status === 'upcoming') return t(locale, 'upcoming')
  if (status === 'missing') return t(locale, 'missing_evidence')
  if (status === 'linked') return t(locale, 'linked_evidence')
  return status
}

function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(
    (localStorage.getItem('qs-locale') as Locale) || 'en',
  )
  const [page, setPage] = useState<Page>('dashboard')
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [projectId, setProjectId] = useState('HKHA-PRJ-2026-0147')
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [result, setResult] = useState<ValuationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agentCollapsed, setAgentCollapsed] = useState(
    () => localStorage.getItem('qs-agent-collapsed') === '1',
  )

  useEffect(() => {
    listProjects()
      .then((items) => {
        setProjects(items)
        if (items[0]?.id) setProjectId(items[0].id)
      })
      .catch((err) => setError(String(err)))
  }, [])

  useEffect(() => {
    localStorage.setItem('qs-locale', locale)
  }, [locale])

  useEffect(() => {
    if (!projectId) return
    setWorkspace(null)
    getWorkspace(projectId)
      .then(setWorkspace)
      .catch((err) => setError(String(err)))
  }, [projectId])

  useEffect(() => {
    localStorage.setItem('qs-agent-collapsed', agentCollapsed ? '1' : '0')
  }, [agentCollapsed])

  const project = useMemo(
    () => workspace?.project || projects.find((p) => p.id === projectId) || result?.project,
    [workspace, projects, projectId, result],
  )

  async function onAnalyze() {
    setLoading(true)
    setError('')
    try {
      const data = await analyzeProject(projectId, locale)
      setResult(data)
      setPage('valuation')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      await uploadClaim(projectId, file)
      const data = await analyzeProject(projectId, locale)
      setResult(data)
      setPage('valuation')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const missingEvidence = workspace?.evidence.filter((e) => e.status === 'missing') ?? []
  const linkedEvidence = workspace?.evidence.filter((e) => e.status === 'linked') ?? []

  return (
    <div className={`shell ui-modern ${agentCollapsed ? 'agent-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">{t(locale, 'brand')}</div>
          <div className="brand-product">{t(locale, 'product')}</div>
          <p className="brand-tag">{t(locale, 'tagline')}</p>
        </div>
        <nav className="nav">
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.group}>
              <div className="nav-group-label">{t(locale, group.group)}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={page === item.id ? 'nav-item active' : 'nav-item'}
                  onClick={() => setPage(item.id)}
                >
                  <span className="nav-icon">
                    <NavIcon name={item.icon} />
                  </span>
                  <span className="nav-label">{t(locale, item.label)}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-project">
            <span>{t(locale, 'project')}</span>
            <strong>{projectId}</strong>
          </div>
          <label className="locale-label">
            {t(locale, 'locale')}
            <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="en">English</option>
              <option value="zh-Hant">繁體中文</option>
            </select>
          </label>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{t(locale, NAV_FLAT.find((n) => n.id === page)!.label)}</h1>
            {project && (
              <p className="topbar-sub">
                {project.id} · {project.name}
              </p>
            )}
          </div>
          <div className="topbar-actions">
            <label className="field-inline">
              {t(locale, 'project')}
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={onAnalyze} disabled={loading}>
              {loading ? t(locale, 'analyzing') : t(locale, 'analyze')}
            </button>
            <label className="btn secondary">
              {t(locale, 'upload')}
              <input
                type="file"
                accept=".xlsx"
                hidden
                onChange={(e) => onUpload(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </header>

        {error && <div className="error">{error}</div>}

        <div className="content">
          {page === 'dashboard' && (
            <>
              <div className="hero-board">
                <div>
                  <div className="eyebrow">{t(locale, 'workspace_ready')}</div>
                  <h2 className="hero-title">{t(locale, 'product')}</h2>
                  <p>{t(locale, 'dash_intro')}</p>
                  <div className="hero-actions">
                    <button type="button" onClick={() => setPage('valuation')}>
                      {t(locale, 'open_valuation')}
                    </button>
                    <button type="button" className="ghost" onClick={onAnalyze} disabled={loading}>
                      {loading ? t(locale, 'analyzing') : t(locale, 'analyze')}
                    </button>
                  </div>
                </div>
                <div className="hero-stats">
                  <div className="hero-stat">
                    <span>{t(locale, 'claimed')}</span>
                    <strong>{result ? money(result.summary.claimed_this_period) : '—'}</strong>
                  </div>
                  <div className="hero-stat">
                    <span>{t(locale, 'assessed')}</span>
                    <strong>{result ? money(result.summary.assessed_this_period) : '—'}</strong>
                  </div>
                  <div className="hero-stat">
                    <span>{t(locale, 'risk')}</span>
                    <strong className={result ? `tone-${result.risk_card.band}` : ''}>
                      {result ? result.risk_card.band.toUpperCase() : '—'}
                    </strong>
                  </div>
                  <div className="hero-stat">
                    <span>{t(locale, 'missing_evidence')}</span>
                    <strong>{missingEvidence.length}</strong>
                  </div>
                </div>
              </div>

              <Panel title={t(locale, 'features_title')}>
                <p className="muted">{t(locale, 'features_hint')}</p>
                <div className="module-grid">
                  {NAV_FLAT.filter((n) => n.id !== 'dashboard' && n.id !== 'settings').map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="module-card"
                      onClick={() => setPage(item.id)}
                    >
                      <span className="module-icon">
                        <NavIcon name={item.icon} />
                      </span>
                      <strong>{t(locale, item.label)}</strong>
                      <span>{t(locale, 'go')} →</span>
                    </button>
                  ))}
                </div>
              </Panel>

              {workspace && (
                <div className="two-col">
                  <Panel title={t(locale, 'sop_board')}>
                    <ul className="timeline">
                      {workspace.deadlines.map((d) => (
                        <li key={d.id}>
                          <span className={`pill status-${d.status}`}>{statusLabel(locale, d.status)}</span>
                          <div>
                            <strong>{d.label}</strong>
                            <div className="muted">
                              {t(locale, 'due_date')}: {d.due_date} · {t(locale, 'owner')}: {d.owner}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                  <Panel title={t(locale, 'checks')}>
                    <ul className="check-list">
                      {workspace.automated_checks.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </Panel>
                </div>
              )}
            </>
          )}

          {page === 'projects' && project && (
            <Panel title={project.name}>
              <div className="kv-grid">
                <div><span>{t(locale, 'employer')}</span><strong>{project.employer}</strong></div>
                <div><span>{t(locale, 'contractor')}</span><strong>{project.contractor}</strong></div>
                <div><span>{t(locale, 'valuation_date')}</span><strong>{project.valuation_date}</strong></div>
                <div><span>{t(locale, 'contract_form')}</span><strong>{project.contract_form}</strong></div>
                <div><span>{t(locale, 'retention')}</span><strong>{project.retention_percent}%</strong></div>
                <div><span>ID</span><strong>{project.id}</strong></div>
              </div>
              <p className="notes">{project.notes}</p>
              {workspace && (
                <>
                  <h3>{t(locale, 'files')}</h3>
                  <ul className="file-list">
                    {workspace.files.map((f) => (
                      <li key={f}>
                        <a href={fixtureFileUrl(projectId, f)} target="_blank" rel="noreferrer">
                          {f}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          )}

          {page === 'contract' && workspace && (
            <Panel title={t(locale, 'contract_rules')}>
              <div className="kv-grid">
                {Object.entries(workspace.contract_profile).map(([k, v]) => (
                  <div key={k}>
                    <span>{k.replaceAll('_', ' ')}</span>
                    <strong>{String(v)}</strong>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {page === 'valuation' && (
            <>
              <div className="toolbar-row">
                <button type="button" onClick={onAnalyze} disabled={loading}>
                  {loading ? t(locale, 'analyzing') : t(locale, 'analyze')}
                </button>
                <label className="btn secondary">
                  {t(locale, 'upload')}
                  <input
                    type="file"
                    accept=".xlsx"
                    hidden
                    onChange={(e) => onUpload(e.target.files?.[0] || null)}
                  />
                </label>
                {result && (
                  <a className="btn" href={valuationDownloadUrl(projectId)}>
                    {t(locale, 'download')}
                  </a>
                )}
              </div>

              {!result && <div className="empty">{t(locale, 'no_analysis')}</div>}

              {result && (
                <div className="stack">
                  <div className="two-col">
                    <Panel title={t(locale, 'summary')}>
                      <div className="stats">
                        <div className="stat">
                          <div className="label">{t(locale, 'claimed')}</div>
                          <div className="value">{money(result.summary.claimed_this_period)}</div>
                        </div>
                        <div className="stat">
                          <div className="label">{t(locale, 'assessed')}</div>
                          <div className="value">{money(result.summary.assessed_this_period)}</div>
                        </div>
                        <div className="stat">
                          <div className="label">{t(locale, 'due')}</div>
                          <div className="value">{money(result.summary.amount_due)}</div>
                        </div>
                        <div className="stat">
                          <div className="label">{t(locale, 'retention')}</div>
                          <div className="value">{money(result.summary.retention)}</div>
                        </div>
                      </div>
                      <div className="band-row">
                        <span className="band green">{t(locale, 'green')} {result.summary.green_count}</span>
                        <span className="band amber">{t(locale, 'amber')} {result.summary.amber_count}</span>
                        <span className="band red">{t(locale, 'red')} {result.summary.red_count}</span>
                      </div>
                    </Panel>
                    <Panel title={t(locale, 'risk')}>
                      <div className={`band ${result.risk_card.band}`}>{result.risk_card.band}</div>
                      <h3 className="risk-title">{result.risk_card.title}</h3>
                      <p className="muted">{result.risk_card.recommended_action}</p>
                      <strong>{t(locale, 'drivers')}</strong>
                      <ul>
                        {result.risk_card.drivers.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                      <strong>{t(locale, 'ask_contractor')}</strong>
                      <ul>
                        {result.risk_card.ask_contractor.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </Panel>
                  </div>

                  <div className="two-col">
                    <Panel title={t(locale, 'explanation')}>
                      <div className="pre">{result.llm_explanation}</div>
                    </Panel>
                    <Panel title={t(locale, 'response')}>
                      <div className="pre">{result.draft_payment_response}</div>
                    </Panel>
                  </div>

                  {result.warnings?.length > 0 && (
                    <Panel title={t(locale, 'warnings')}>
                      {result.warnings.map((w) => (
                        <div className="warning" key={w}>{w}</div>
                      ))}
                    </Panel>
                  )}

                  <Panel title={t(locale, 'lines')}>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Description</th>
                            <th>Claimed</th>
                            <th>Assessed</th>
                            <th>Diff</th>
                            <th>Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.lines.map((line) => (
                            <tr key={line.item_no}>
                              <td>{line.item_no}</td>
                              <td>
                                {line.description}
                                {line.issues?.length > 0 && (
                                  <div className="issues">{line.issues.join(' · ')}</div>
                                )}
                              </td>
                              <td className="mono">{money(line.claimed_amount)}</td>
                              <td className="mono">{money(line.assessed_amount)}</td>
                              <td className="mono">{money(line.difference_amount)}</td>
                              <td><span className={`band ${line.risk}`}>{line.risk}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                </div>
              )}
            </>
          )}

          {page === 'evidence' && workspace && (
            <div className="two-col">
              <Panel title={t(locale, 'linked_evidence')}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedEvidence.map((e) => (
                      <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>{e.name}</td>
                        <td>{e.type}</td>
                        <td>{e.linked_items.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
              <Panel title={t(locale, 'missing_evidence')}>
                <ul className="gap-list">
                  {missingEvidence.map((e) => (
                    <li key={e.id}>
                      <span className="pill status-open">{statusLabel(locale, e.status)}</span>
                      <div>
                        <strong>{e.name}</strong>
                        <div className="muted">{e.type} · {e.linked_items.join(', ')}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}

          {page === 'cpecs' && (
            <Panel title={t(locale, 'cpecs')}>
              {!result && <div className="empty">{t(locale, 'no_analysis')}</div>}
              {result && (
                <>
                  <p>{result.cpecs.summary}</p>
                  <p className="muted">Mode: {result.cpecs.mode}</p>
                  <ul className="finding-list">
                    {result.cpecs.findings.map((f) => (
                      <li key={f.code}>
                        <span className={`band ${f.severity}`}>{f.severity}</span>
                        <div>
                          <strong>{f.code}</strong>
                          {f.related_item ? ` · ${f.related_item}` : ''}
                          <div>{f.message}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          )}

          {page === 'market' && (
            <Panel title={t(locale, 'benchmarks')}>
              {!result && <div className="empty">{t(locale, 'no_analysis')}</div>}
              {result && (
                <div className="bench-grid">
                  {result.benchmarks.map((b) => (
                    <div className="bench-card" key={b.label}>
                      <div className="bench-top">
                        <strong>{b.label}</strong>
                        <span className="pill">{b.live ? t(locale, 'live') : t(locale, 'fallback')}</span>
                      </div>
                      <div className="muted">{b.source}</div>
                      {b.value != null && <div className="bench-value">{b.value}</div>}
                      <p>{b.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {page === 'intel' && workspace && (
            <Panel title={t(locale, 'nav_intel')}>
              <div className="intel-grid">
                {workspace.contract_intelligence.map((c) => (
                  <article key={c.topic} className="intel-card">
                    <h3>{c.topic}</h3>
                    <div className="muted">{t(locale, 'clause_ref')}: {c.clause_ref}</div>
                    <p>{c.summary}</p>
                  </article>
                ))}
              </div>
            </Panel>
          )}

          {page === 'deadlines' && workspace && (
            <Panel title={t(locale, 'sop_board')}>
              <table>
                <thead>
                  <tr>
                    <th>{t(locale, 'nav_deadlines')}</th>
                    <th>{t(locale, 'due_date')}</th>
                    <th>{t(locale, 'owner')}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.deadlines.map((d) => (
                    <tr key={d.id}>
                      <td>{d.label}</td>
                      <td>{d.due_date}</td>
                      <td>{d.owner}</td>
                      <td><span className={`pill status-${d.status}`}>{statusLabel(locale, d.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}

          {page === 'reports' && workspace && (
            <Panel title={t(locale, 'outputs')}>
              <div className="module-grid">
                {workspace.outputs.map((o) => {
                  const ready =
                    o.available_after === 'always' || (o.available_after === 'analysis' && !!result)
                  return (
                    <div key={o.id} className="module-card static">
                      <strong>{o.label}</strong>
                      <span className="muted">
                        {o.available_after === 'always' ? t(locale, 'always') : t(locale, 'after_analysis')}
                      </span>
                      {o.id === 'valuation_xlsx' && ready ? (
                        <a className="btn" href={valuationDownloadUrl(projectId)}>
                          {t(locale, 'download')}
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled={!ready}
                          onClick={() => {
                            if (o.id === 'payment_response' || o.id === 'exception_report') setPage('valuation')
                            if (o.id === 'evidence_index') setPage('evidence')
                            if (o.id === 'deadline_board') setPage('deadlines')
                          }}
                        >
                          {ready ? t(locale, 'go') : '…'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              {result && (
                <div className="two-col" style={{ marginTop: 16 }}>
                  <Panel title={t(locale, 'response')}>
                    <div className="pre">{result.draft_payment_response}</div>
                  </Panel>
                  <Panel title={t(locale, 'risk')}>
                    <div className={`band ${result.risk_card.band}`}>{result.risk_card.band}</div>
                    <p>{result.risk_card.title}</p>
                    <p className="muted">{result.risk_card.recommended_action}</p>
                  </Panel>
                </div>
              )}
            </Panel>
          )}

          {page === 'audit' && workspace && (
            <Panel title={t(locale, 'nav_audit')}>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.audit_trail.map((a, i) => (
                    <tr key={`${a.time}-${i}`}>
                      <td>{a.time}</td>
                      <td>{a.actor}</td>
                      <td>{a.action}</td>
                    </tr>
                  ))}
                  {result && (
                    <tr>
                      <td>{project?.valuation_date} —</td>
                      <td>qs.user</td>
                      <td>
                        Valuation analysis completed · confidence {result.risk_card.band} · due{' '}
                        {money(result.summary.amount_due)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Panel>
          )}

          {page === 'settings' && (
            <Panel title={t(locale, 'nav_settings')}>
              <div className="kv-grid">
                <div>
                  <span>{t(locale, 'settings_lang')}</span>
                  <strong>
                    <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                      <option value="en">English</option>
                      <option value="zh-Hant">繁體中文</option>
                    </select>
                  </strong>
                </div>
                <div>
                  <span>{t(locale, 'settings_api')}</span>
                  <strong className="mono">{API_BASE || '(same origin)'}</strong>
                </div>
              </div>
              <p className="notes">{t(locale, 'settings_note')}</p>
            </Panel>
          )}
        </div>
      </div>

      <AgentPanel
        locale={locale}
        projectId={projectId}
        collapsed={agentCollapsed}
        onToggle={() => setAgentCollapsed((v) => !v)}
        onNavigate={(p) => setPage(p)}
        onAnalyze={async () => {
          await onAnalyze()
        }}
        onDownload={() => {
          window.open(valuationDownloadUrl(projectId), '_blank')
        }}
      />
    </div>
  )
}
