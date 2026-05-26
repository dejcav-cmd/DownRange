'use client'
import { useState } from 'react'

const SUGGESTED = [
  "Can I carry in Texas with a Florida CPL?",
  "What states have red flag laws?",
  "Is a suppressor legal in Washington state?",
  "Which states allow constitutional carry?",
  "Can I fly with a firearm to California?",
]

export default function LawAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function ask(question) {
    if (!question.trim()) return
    const q = question.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/law-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer || 'Unable to answer right now. Please try again.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#0D1117', border: '1px solid #C8922A40', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 36, height: 36, background: '#C8922A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#000', fontSize: '16px' }}>⚖</span>
        </div>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', color: '#F5F5F3', letterSpacing: '0.05em' }}>DOWNRANGE LAW ASSISTANT</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#4B5563' }}>Powered by Claude AI + DownRange state database</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#34D399' }}>ONLINE</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '10px 24px', background: '#1A0E00', borderBottom: '1px solid var(--border)', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#92400E', letterSpacing: '0.05em' }}>
        ⚠ NOT LEGAL ADVICE — For general information only. Consult a qualified attorney for legal decisions.
      </div>

      {/* Messages */}
      <div style={{ minHeight: '280px', maxHeight: '420px', overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 && (
          <div style={{ color: '#4B5563', fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', lineHeight: 1.7 }}>
            Ask me anything about US firearms law. State carry laws, reciprocity, AWB, suppressor regulations, storage requirements — I know them all.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: 28, height: 28, flexShrink: 0, background: m.role === 'user' ? '#1F2428' : '#C8922A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: m.role === 'user' ? '#9CA3AF' : '#000' }}>
              {m.role === 'user' ? 'YOU' : '⚖'}
            </div>
            <div style={{ background: m.role === 'user' ? '#111318' : '#0D1117', border: `1px solid ${m.role === 'user' ? '#1F2428' : '#C8922A30'}`, padding: '12px 16px', maxWidth: '85%', fontSize: '14px', color: '#D1D5DB', lineHeight: 1.7, fontFamily: m.role === 'user' ? 'monospace' : "'IBM Plex Sans', sans-serif" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ width: 28, height: 28, background: '#C8922A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#000' }}>⚖</div>
            <div style={{ background: '#0D1117', border: '1px solid #C8922A30', padding: '12px 16px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: '#4B5563' }}>
              Checking state database...
            </div>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SUGGESTED.map(q => (
            <button key={q} onClick={() => ask(q)}
              style={{ background: '#111318', border: '1px solid var(--border)', color: '#6B7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', padding: '6px 12px', cursor: 'pointer', textAlign: 'left' }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(input)}
          placeholder="Ask about carry laws, reciprocity, regulations..."
          style={{ flex: 1, background: '#111318', border: '1px solid var(--border)', color: '#E8E6E1', padding: '10px 14px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px' }}
        />
        <button onClick={() => ask(input)} disabled={loading || !input.trim()}
          style={{ background: '#C8922A', color: '#000', border: 'none', padding: '10px 20px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
          ASK →
        </button>
      </div>
    </div>
  )
}
