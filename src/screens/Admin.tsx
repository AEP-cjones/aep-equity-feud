import { useState, useEffect } from 'react'
import {
  useConfig, useRounds, saveRound, deleteRound, createRound,
  useLeads,
} from '../hooks/useFirebase'
import { dbRef, remove } from '../firebase'
import { downloadCsv } from '../utils/csv'
import AepHeader from '../components/AepHeader'
import type { Round, Answer } from '../types'

export default function Admin() {
  const config = useConfig()
  const rounds = useRounds()
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [editingRound, setEditingRound] = useState<string | null>(null)

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col">
        <AepHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-[var(--navy-light)] rounded-xl p-8 w-80">
            <h2 className="font-bungee text-xl text-[var(--gold)] mb-4 text-center">Admin Login</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') tryLogin()
              }}
              placeholder="Password"
              className="w-full bg-[var(--navy-mid)] rounded-lg px-4 py-3 text-white border border-transparent focus:border-[var(--gold)] outline-none mb-3"
            />
            <button
              onClick={tryLogin}
              className="w-full py-3 bg-[var(--gold)] text-[var(--navy)] rounded-lg font-bungee hover:bg-[var(--gold-dark)]"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    )
  }

  function tryLogin() {
    if (password === (config?.adminPassword || 'aep2026')) {
      setAuthed(true)
    } else {
      alert('Wrong password')
    }
  }

  const roundKeys = Object.keys(rounds || {})

  return (
    <div className="min-h-screen flex flex-col">
      <AepHeader />
      <div className="p-4 max-w-3xl mx-auto w-full space-y-4">
        <h1 className="font-bungee text-2xl text-[var(--gold)] text-center">Admin Panel</h1>

        <button
          onClick={async () => {
            const id = await createRound({
              question: 'New Question',
              answers: [
                { text: 'Answer 1', points: 40, revealed: false },
                { text: 'Answer 2', points: 30, revealed: false },
                { text: 'Answer 3', points: 20, revealed: false },
                { text: 'Answer 4', points: 10, revealed: false },
                { text: 'Answer 5', points: 5, revealed: false },
              ],
            })
            setEditingRound(id)
          }}
          className="w-full py-3 bg-[var(--gold)] text-[var(--navy)] rounded-lg font-bungee hover:bg-[var(--gold-dark)]"
        >
          + Add Round
        </button>

        {roundKeys.map((key) => (
          <RoundEditor
            key={key}
            roundId={key}
            round={rounds![key]}
            isExpanded={editingRound === key}
            onToggle={() => setEditingRound(editingRound === key ? null : key)}
            onDelete={async () => {
              if (confirm(`Delete ${key}?`)) {
                await deleteRound(key)
                if (editingRound === key) setEditingRound(null)
              }
            }}
          />
        ))}

        {roundKeys.length === 0 && (
          <p className="text-center opacity-50 py-8">No rounds yet. Add one above.</p>
        )}

        <LeadsSection />
      </div>
    </div>
  )
}

function LeadsSection() {
  const leads = useLeads()
  const rows = leads ? Object.values(leads) : []
  const count = rows.length

  return (
    <div className="bg-[var(--navy-light)] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bungee text-lg text-[var(--gold)]">Leads ({count})</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              downloadCsv(
                `equity-family-feud-leads-${new Date().toISOString().slice(0, 10)}.csv`,
                rows.map((r) => ({
                  firstName: r.firstName,
                  lastName: r.lastName,
                  email: r.email,
                  company: r.company || '',
                  phone: r.phone || '',
                  team: r.team ?? '',
                  submittedAt: r.submittedAt,
                })),
              )
            }}
            disabled={count === 0}
            className="px-3 py-2 bg-[var(--gold)] text-[var(--navy)] rounded-lg font-bold hover:bg-[var(--gold-dark)] disabled:opacity-30 text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={async () => {
              if (!confirm(`Clear all ${count} leads? This cannot be undone.`)) return
              await remove(dbRef('leads'))
            }}
            disabled={count === 0}
            className="px-3 py-2 bg-red-900 rounded-lg hover:bg-red-800 disabled:opacity-30 text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {count === 0 ? (
        <p className="text-sm opacity-50 text-center py-4">No leads collected yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-60 uppercase tracking-widest">
              <tr>
                <th className="text-left py-2 pr-3">Name</th>
                <th className="text-left py-2 pr-3">Email</th>
                <th className="text-left py-2 pr-3">Company</th>
                <th className="text-left py-2 pr-3">Phone</th>
                <th className="text-left py-2 pr-3">Team</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2 pr-3">{r.firstName} {r.lastName}</td>
                  <td className="py-2 pr-3 opacity-80">{r.email}</td>
                  <td className="py-2 pr-3 opacity-80">{r.company || '—'}</td>
                  <td className="py-2 pr-3 opacity-80">{r.phone || '—'}</td>
                  <td className="py-2 pr-3 opacity-80">{r.team ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RoundEditor({
  roundId,
  round,
  isExpanded,
  onToggle,
  onDelete,
}: {
  roundId: string
  round: Round
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const [question, setQuestion] = useState(round.question)
  const [answers, setAnswers] = useState<Answer[]>(round.answers)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setQuestion(round.question)
    setAnswers(round.answers)
    setDirty(false)
  }, [round])

  function updateAnswer(index: number, field: keyof Answer, value: string | number) {
    const newAnswers = [...answers]
    newAnswers[index] = { ...newAnswers[index], [field]: value }
    setAnswers(newAnswers)
    setDirty(true)
  }

  function addAnswer() {
    if (answers.length >= 8) return
    setAnswers([...answers, { text: '', points: 0, revealed: false }])
    setDirty(true)
  }

  function removeAnswer(index: number) {
    if (answers.length <= 1) return
    setAnswers(answers.filter((_, i) => i !== index))
    setDirty(true)
  }

  function moveAnswer(index: number, dir: -1 | 1) {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= answers.length) return
    const newAnswers = [...answers]
    ;[newAnswers[index], newAnswers[newIndex]] = [newAnswers[newIndex], newAnswers[index]]
    setAnswers(newAnswers)
    setDirty(true)
  }

  async function handleSave() {
    await saveRound(roundId, {
      question,
      answers: answers.map((a) => ({ ...a, revealed: false })),
    })
    setDirty(false)
  }

  return (
    <div className="bg-[var(--navy-light)] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--navy-mid)]/30 transition-colors"
      >
        <span className="font-bungee text-lg">{roundId}</span>
        <span className="text-sm opacity-70 truncate max-w-[60%] text-right">{round.question}</span>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3 border-t border-[var(--navy-mid)]">
          <div>
            <label className="text-xs opacity-50">Question</label>
            <input
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value)
                setDirty(true)
              }}
              className="w-full bg-[var(--navy-mid)] rounded-lg px-3 py-2 text-white border border-transparent focus:border-[var(--gold)] outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs opacity-50">
              Answers ({answers.length}/8) — ranked by points
            </label>
            {answers.map((answer, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-bungee text-sm w-6 text-center opacity-50">{i + 1}</span>
                <input
                  value={answer.text}
                  onChange={(e) => updateAnswer(i, 'text', e.target.value)}
                  placeholder="Answer text"
                  className="flex-1 bg-[var(--navy-mid)] rounded-lg px-3 py-2 text-white text-sm border border-transparent focus:border-[var(--gold)] outline-none"
                />
                <input
                  type="number"
                  value={answer.points}
                  onChange={(e) => updateAnswer(i, 'points', parseInt(e.target.value) || 0)}
                  className="w-20 bg-[var(--navy-mid)] rounded-lg px-3 py-2 text-white text-sm border border-transparent focus:border-[var(--gold)] outline-none text-center"
                  placeholder="Pts"
                />
                <button
                  onClick={() => moveAnswer(i, -1)}
                  className="p-1 hover:text-[var(--gold)] disabled:opacity-20"
                  disabled={i === 0}
                >
                  ▲
                </button>
                <button
                  onClick={() => moveAnswer(i, 1)}
                  className="p-1 hover:text-[var(--gold)] disabled:opacity-20"
                  disabled={i === answers.length - 1}
                >
                  ▼
                </button>
                <button
                  onClick={() => removeAnswer(i)}
                  className="p-1 hover:text-[var(--strike-red)] text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {answers.length < 8 && (
              <button
                onClick={addAnswer}
                className="px-4 py-2 bg-[var(--navy-mid)] rounded-lg hover:bg-[var(--navy-mid)]/80 text-sm"
              >
                + Add Answer
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="px-4 py-2 bg-[var(--gold)] text-[var(--navy)] rounded-lg font-bold hover:bg-[var(--gold-dark)] disabled:opacity-30 text-sm"
            >
              Save Round
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-900 rounded-lg hover:bg-red-800 text-sm ml-auto"
            >
              Delete Round
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
