import { apiUrl } from './config'
import { authHeaders } from './api/authToken'

export type RiskBand = 'green' | 'amber' | 'red'

export interface ProjectInfo {
  id: string
  name: string
  contract_form: string
  employer: string
  contractor: string
  valuation_date: string
  currency: string
  retention_percent: number
  notes: string
}

export interface ValuationResult {
  project: ProjectInfo
  lines: Array<{
    item_no: string
    description: string
    unit: string
    contract_qty: number
    rate: number
    claimed_qty: number
    claimed_amount: number
    assessed_qty: number
    assessed_amount: number
    difference_amount: number
    risk: RiskBand
    issues: string[]
    category: string
  }>
  summary: {
    contract_sum: number
    previous_certified: number
    claimed_this_period: number
    assessed_this_period: number
    cumulative_assessed: number
    retention: number
    amount_due: number
    green_count: number
    amber_count: number
    red_count: number
  }
  cpecs: {
    mode: string
    summary: string
    findings: Array<{
      code: string
      severity: RiskBand
      message: string
      related_item?: string
    }>
  }
  benchmarks: Array<{
    source: string
    label: string
    value?: number | null
    period?: string | null
    note: string
    live: boolean
  }>
  risk_card: {
    band: RiskBand
    title: string
    drivers: string[]
    recommended_action: string
    ask_contractor: string[]
    score: number
  }
  llm_explanation: string
  draft_payment_response: string
  warnings: string[]
}

export interface Workspace {
  project: ProjectInfo
  files: string[]
  contract_profile: {
    contract_form: string
    payment_cycle: string
    billing_date: string
    response_window_days: number
    payment_window_days: number
    retention_percent: number
    retention_limit_hkd: number
    materials_on_site: string
    variations: string
    fluctuation: string
    currency: string
    approver: string
    cap652_applicable: boolean
  }
  deadlines: Array<{
    id: string
    label: string
    due_date: string
    status: string
    owner: string
  }>
  evidence: Array<{
    id: string
    name: string
    type: string
    status: string
    linked_items: string[]
  }>
  contract_intelligence: Array<{
    topic: string
    clause_ref: string
    summary: string
  }>
  automated_checks: string[]
  outputs: Array<{
    id: string
    label: string
    available_after: string
  }>
  audit_trail: Array<{
    time: string
    actor: string
    action: string
  }>
}

export async function listProjects(): Promise<ProjectInfo[]> {
  const res = await fetch(apiUrl('/api/projects'))
  if (!res.ok) throw new Error('Failed to load projects')
  const data = await res.json()
  return data.projects
}

export async function getWorkspace(projectId: string): Promise<Workspace> {
  const res = await fetch(apiUrl(`/api/projects/${projectId}/workspace`))
  if (!res.ok) throw new Error('Failed to load workspace')
  return res.json()
}

export async function analyzeProject(
  projectId: string,
  locale: 'en' | 'zh-Hant',
): Promise<ValuationResult> {
  const res = await fetch(apiUrl(`/api/projects/${projectId}/analyze`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, locale, use_llm: true }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Analyze failed')
  }
  return res.json()
}

export async function uploadClaim(projectId: string, file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(apiUrl(`/api/projects/${projectId}/upload-claim`), {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Upload failed')
}

export function valuationDownloadUrl(projectId: string): string {
  return apiUrl(`/api/projects/${projectId}/valuation.xlsx`)
}

export function fixtureFileUrl(projectId: string, filename: string): string {
  return apiUrl(`/api/projects/${projectId}/files/${encodeURIComponent(filename)}`)
}

export type CaptureSource = 'mobile' | 'gov_platform' | 'drone_batch' | 'drone_api'

export interface CaptureSourceInfo {
  id: CaptureSource
  label: string
  detail: string
}

export interface CaptureItem {
  id: string
  source: CaptureSource
  item_no: string
  description: string
  media_ref: string
  percent_complete?: number | null
  note: string
  captured_at: string
  status: string
}

export interface IpcDraft {
  project_id: string
  certificate_no: string
  ipc_text: string
  amount_due: number
  generated_at: string
}

export async function getCaptureSources(): Promise<CaptureSourceInfo[]> {
  const res = await fetch(apiUrl('/api/capture/sources'))
  if (!res.ok) throw new Error('Failed to load capture sources')
  return (await res.json()).sources
}

export async function listCaptures(projectId: string): Promise<CaptureItem[]> {
  const res = await fetch(apiUrl(`/api/projects/${projectId}/captures`))
  if (!res.ok) throw new Error('Failed to load captures')
  return (await res.json()).captures
}

export async function addCapture(
  projectId: string,
  body: { source: CaptureSource; item_no?: string; description?: string; percent_complete?: number | null },
): Promise<CaptureItem> {
  const res = await fetch(apiUrl(`/api/projects/${projectId}/captures`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to add capture')
  return res.json()
}

export async function generateIpc(projectId: string): Promise<IpcDraft> {
  const res = await fetch(apiUrl(`/api/projects/${projectId}/ipc`), { method: 'POST' })
  if (!res.ok) throw new Error('Failed to generate IPC')
  return res.json()
}

export interface AgentAction {
  type: string
  page?: string
}

export interface AgentChatResponse {
  reply: string
  actions: AgentAction[]
  tool_trace?: Array<{ name: string; ok?: boolean }>
  model?: {
    provider?: string
    model_id?: string
    configured?: boolean
    base_url?: string | null
    error?: string
  }
  mode?: string
  notice?: string
}

export async function getAgentStatus(): Promise<Record<string, unknown>> {
  const res = await fetch(apiUrl('/api/agent/status'))
  if (!res.ok) throw new Error('Failed to load agent status')
  return res.json()
}

export async function chatWithAgent(input: {
  projectId: string
  message: string
  locale: 'en' | 'zh-Hant'
  history: Array<{ role: string; content: string }>
}): Promise<AgentChatResponse> {
  const res = await fetch(apiUrl('/api/agent/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({
      project_id: input.projectId,
      message: input.message,
      locale: input.locale,
      history: input.history,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Agent chat failed')
  }
  return res.json()
}
