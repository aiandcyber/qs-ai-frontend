import { useEffect, useRef, useState } from 'react'
import {
  chatWithAgent,
  getAgentStatus,
  type AgentAction,
  type AgentChatResponse,
} from '../api'
import { t, type Locale } from '../i18n'

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

interface Msg {
  role: 'user' | 'assistant'
  content: string
  actions?: AgentAction[]
  notice?: string
}

const SUGGESTIONS_EN = [
  'Run valuation analysis for this claim',
  'What evidence is still missing?',
  'Show SOP payment deadlines',
  'Summarise CPECS findings',
  'Draft the payment response next steps',
]

const SUGGESTIONS_ZH = [
  '為本期申索執行估值分析',
  '還欠哪些證據？',
  '顯示 SOP 付款期限',
  '摘要 CPECS 發現',
  '付款回應草稿下一步',
]

export default function AgentPanel({
  locale,
  projectId,
  collapsed,
  onToggle,
  onNavigate,
  onAnalyze,
  onDownload,
}: {
  locale: Locale
  projectId: string
  collapsed: boolean
  onToggle: () => void
  onNavigate: (page: Page) => void
  onAnalyze: () => Promise<void>
  onDownload: () => void
}) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [modelLine, setModelLine] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAgentStatus()
      .then((s: Record<string, unknown>) => {
        const provider = String(s.provider || '')
        const model = String(s.model_id || '')
        const ok = Boolean(s.configured)
        setModelLine(
          ok
            ? `${provider} · ${model}`
            : locale === 'zh-Hant'
              ? `${provider} · 未設定（規則模式）`
              : `${provider} · not configured (rules mode)`,
        )
      })
      .catch(() => setModelLine('agent offline'))
  }, [locale])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    setMessages([])
  }, [projectId])

  async function applyActions(actions: AgentAction[] | undefined) {
    if (!actions?.length) return
    for (const a of actions) {
      if (a.type === 'navigate' && a.page) onNavigate(a.page as Page)
      if (a.type === 'refresh_analysis' || a.type === 'run_analyze') await onAnalyze()
      if (a.type === 'download_valuation') onDownload()
    }
  }

  async function send(text: string) {
    const message = text.trim()
    if (!message || busy) return
    setInput('')
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setBusy(true)
    try {
      const data: AgentChatResponse = await chatWithAgent({
        projectId,
        message,
        locale,
        history,
      })
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          actions: data.actions,
          notice: data.notice,
        },
      ])
      if (data.model?.provider) {
        setModelLine(
          `${data.model.provider} · ${data.model.model_id || ''}${
            data.mode === 'rules' ? (locale === 'zh-Hant' ? ' · 規則' : ' · rules') : ''
          }`,
        )
      }
      // Soft-apply navigations from tools; run_analyze only via explicit button to avoid double runs
      for (const a of data.actions || []) {
        if (a.type === 'navigate' && a.page) onNavigate(a.page as Page)
        if (a.type === 'refresh_analysis') await onAnalyze()
        if (a.type === 'download_valuation') onDownload()
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: String(err) },
      ])
    } finally {
      setBusy(false)
    }
  }

  if (collapsed) {
    return (
      <aside className="agent-rail collapsed">
        <button type="button" className="agent-expand" onClick={onToggle} title={t(locale, 'agent_open')}>
          <span>{t(locale, 'agent_brand')}</span>
        </button>
      </aside>
    )
  }

  const suggestions = locale === 'zh-Hant' ? SUGGESTIONS_ZH : SUGGESTIONS_EN

  return (
    <aside className="agent-rail">
      <div className="agent-head">
        <div>
          <div className="agent-title">{t(locale, 'agent_title')}</div>
          <div className="agent-sub">{t(locale, 'agent_sub')}</div>
        </div>
        <button type="button" className="agent-collapse" onClick={onToggle}>
          {t(locale, 'agent_collapse')}
        </button>
      </div>

      <div className="agent-disclaimer">{t(locale, 'agent_disclaimer')}</div>

      <div className="agent-messages">
        {messages.length === 0 && (
          <div className="agent-empty">
            <p>{t(locale, 'agent_welcome')}</p>
            <div className="agent-suggestions">
              {suggestions.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={busy}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`agent-bubble ${m.role}`}>
            <div className="agent-bubble-text">{m.content}</div>
            {m.notice && <div className="agent-notice">{m.notice}</div>}
            {m.actions && m.actions.length > 0 && (
              <div className="agent-actions">
                {m.actions.map((a, idx) => {
                  if (a.type === 'navigate' && a.page) {
                    return (
                      <button
                        key={`${a.type}-${a.page}-${idx}`}
                        type="button"
                        className="chip"
                        onClick={() => onNavigate(a.page as Page)}
                      >
                        {t(locale, 'agent_open_module')}: {a.page}
                      </button>
                    )
                  }
                  if (a.type === 'run_analyze' || a.type === 'refresh_analysis') {
                    return (
                      <button
                        key={`${a.type}-${idx}`}
                        type="button"
                        className="chip accent"
                        onClick={() => applyActions([a])}
                        disabled={busy}
                      >
                        {t(locale, 'analyze')}
                      </button>
                    )
                  }
                  if (a.type === 'download_valuation') {
                    return (
                      <button
                        key={`${a.type}-${idx}`}
                        type="button"
                        className="chip"
                        onClick={onDownload}
                      >
                        {t(locale, 'download')}
                      </button>
                    )
                  }
                  return null
                })}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="agent-typing">{t(locale, 'agent_thinking')}</div>}
        <div ref={bottomRef} />
      </div>

      <form
        className="agent-composer"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(locale, 'agent_placeholder')}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          {t(locale, 'agent_send')}
        </button>
      </form>
      <div className="agent-model">{modelLine}</div>
    </aside>
  )
}
