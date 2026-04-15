import { useState, useEffect, useMemo } from 'react'
import {
  useGameState,
  useConfig,
  useRounds,
  updateGameState,
  updateConfig,
  revealAnswer,
  resetRoundAnswers,
  useAudiencePlayers,
  useAudienceAnswersForRound,
  resetAudience,
} from '../hooks/useFirebase'
import AepHeader from '../components/AepHeader'
import Panel from '../components/Panel'
import type { GameState, Round, AudiencePlayers, AudienceAnswer } from '../types'

export default function Host() {
  const gameState = useGameState()
  const config = useConfig()
  const rounds = useRounds()

  if (!gameState || !config || !rounds) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl opacity-50">Loading host panel...</p>
      </div>
    )
  }

  const roundKeys = Object.keys(rounds)
  const currentRound = rounds[gameState.currentRound]

  return (
    <div className="min-h-screen flex flex-col">
      <AepHeader />
      <Scoreboard gameState={gameState} config={config} />
      <div className="p-4 max-w-3xl mx-auto w-full space-y-4">
        {/* Team Names */}
        <TeamNameEditor config={config} />

        {/* Round Selector */}
        <Panel title="Round Select">
          <div className="flex flex-wrap gap-2">
            {roundKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleSelectRound(key, rounds[key])}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  gameState.currentRound === key
                    ? 'bg-[var(--gold)] text-[var(--navy)]'
                    : 'bg-[var(--navy-mid)] hover:bg-[var(--navy-mid)]/80'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          {roundKeys.length === 0 && (
            <p className="opacity-50">No rounds created. Go to /admin to add rounds.</p>
          )}
        </Panel>

        {/* Audience */}
        <AudiencePanel
          currentRoundId={gameState.currentRound}
          team1Name={config.team1Name}
          team2Name={config.team2Name}
        />

        {/* Current Round Answers */}
        {currentRound && (
          <Panel title="Reveal Answers">
            <h4 className="font-bungee text-lg mb-1 text-[var(--gold)]">
              {currentRound.question}
            </h4>
            <p className="text-sm opacity-50 mb-3">Tap an answer to reveal it on the board</p>
            <div className="space-y-2">
              {currentRound.answers.map((answer, i) => (
                <button
                  key={i}
                  onClick={() => handleRevealAnswer(gameState.currentRound, i, answer.points, gameState)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    answer.revealed
                      ? 'bg-[var(--gold)]/20 border border-[var(--gold)] text-[var(--gold)]'
                      : 'bg-[var(--navy-mid)] hover:bg-[var(--navy-mid)]/80 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-bungee text-lg w-8">{i + 1}</span>
                    <span className="text-left font-semibold">{answer.text}</span>
                  </span>
                  <span className="font-bungee text-lg">{answer.points} pts</span>
                </button>
              ))}
            </div>
          </Panel>
        )}

        {/* Game Controls */}
        <Panel title="Controls" bodyClassName="space-y-3">
          {/* Strike Button */}
          <button
            onClick={() => handleStrike(gameState)}
            disabled={gameState.strikes >= 3}
            className="w-full py-4 bg-[var(--strike-red)] hover:bg-[var(--strike-red)]/80 disabled:opacity-30 rounded-xl font-bungee text-2xl transition-all"
          >
            STRIKE! ({gameState.strikes}/3)
          </button>

          {/* Active Team Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => updateGameState({ activeTeam: 1 })}
              className={`flex-1 py-3 rounded-lg font-bungee transition-all ${
                gameState.activeTeam === 1
                  ? 'bg-blue-600 ring-2 ring-blue-400'
                  : 'bg-[var(--navy-mid)]'
              }`}
            >
              {config.team1Name}
            </button>
            <button
              onClick={() => updateGameState({ activeTeam: 2 })}
              className={`flex-1 py-3 rounded-lg font-bungee transition-all ${
                gameState.activeTeam === 2
                  ? 'bg-[var(--aep-red)] ring-2 ring-red-400'
                  : 'bg-[var(--navy-mid)]'
              }`}
            >
              {config.team2Name}
            </button>
          </div>

          {/* Score Adjustment */}
          <div className="grid grid-cols-2 gap-4">
            <ScoreControl
              label={config.team1Name}
              score={gameState.team1Score}
              onAdd={(n) => updateGameState({ team1Score: gameState.team1Score + n })}
            />
            <ScoreControl
              label={config.team2Name}
              score={gameState.team2Score}
              onAdd={(n) => updateGameState({ team2Score: gameState.team2Score + n })}
            />
          </div>

          {/* Steal Resolution — only shown when a team has struck out */}
          {gameState.status === 'steal' && <StealResolution gameState={gameState} config={config} />}

          {/* Award Round Points */}
          {gameState.roundPoints > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateGameState({
                    team1Score: gameState.team1Score + gameState.roundPoints,
                    roundPoints: 0,
                  })
                }}
                className="flex-1 py-3 bg-blue-600 rounded-lg font-bungee hover:bg-blue-500"
              >
                Award {gameState.roundPoints} to {config.team1Name}
              </button>
              <button
                onClick={() => {
                  updateGameState({
                    team2Score: gameState.team2Score + gameState.roundPoints,
                    roundPoints: 0,
                  })
                }}
                className="flex-1 py-3 bg-[var(--aep-red)] rounded-lg font-bungee hover:bg-red-600"
              >
                Award {gameState.roundPoints} to {config.team2Name}
              </button>
            </div>
          )}

          {/* Game State Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => updateGameState({ status: 'title' })}
              className="px-4 py-2 bg-[var(--navy-mid)] rounded-lg hover:bg-[var(--navy-mid)]/80"
            >
              Title Screen
            </button>
            <button
              onClick={() => updateGameState({ status: 'final' })}
              className="px-4 py-2 bg-[var(--gold)] text-[var(--navy)] rounded-lg font-bold hover:bg-[var(--gold-dark)]"
            >
              Final Scores
            </button>
            <button
              onClick={() => handleResetGame()}
              className="px-4 py-2 bg-red-900 rounded-lg hover:bg-red-800"
            >
              Reset Game
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

async function handleSelectRound(roundId: string, round: Round) {
  await resetRoundAnswers(roundId, round.answers)
  await updateGameState({
    currentRound: roundId,
    status: 'playing',
    strikes: 0,
    roundPoints: 0,
  })
}

async function handleRevealAnswer(
  roundId: string,
  answerIndex: number,
  points: number,
  gameState: GameState
) {
  await revealAnswer(roundId, answerIndex)
  await updateGameState({
    roundPoints: gameState.roundPoints + points,
  })
}

async function handleStrike(gameState: GameState) {
  const newStrikes = gameState.strikes + 1
  await updateGameState({
    strikes: newStrikes,
    status: newStrikes >= 3 ? 'steal' : gameState.status,
  })
}

async function handleResetGame() {
  await updateGameState({
    status: 'title',
    currentRound: '',
    strikes: 0,
    team1Score: 0,
    team2Score: 0,
    roundPoints: 0,
    activeTeam: 1,
  })
}

function Scoreboard({
  gameState,
  config,
}: {
  gameState: GameState
  config: { team1Name: string; team2Name: string }
}) {
  return (
    <div
      className="sticky top-0 z-30 w-full"
      style={{
        background: 'linear-gradient(180deg, var(--navy-light) 0%, var(--navy) 100%)',
        borderBottom: '2px solid var(--gold)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-2 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <ScoreboardTeamCard
          name={config.team1Name}
          score={gameState.team1Score}
          accent="blue"
          active={gameState.activeTeam === 1}
        />

        <div className="flex flex-col items-center gap-1.5 min-w-[180px]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.22em] uppercase opacity-60">Round</span>
            <span
              className="font-bungee text-sm px-2 py-0.5 rounded"
              style={{ background: 'var(--navy-mid)', color: 'var(--gold)' }}
            >
              {gameState.currentRound || '—'}
            </span>
            <StatusPill status={gameState.status} />
          </div>
          <StrikeDots strikes={gameState.strikes} />
          {gameState.roundPoints > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="opacity-60 tracking-widest uppercase">Round Points</span>
              <span
                className="font-bungee px-2 py-0.5 rounded"
                style={{
                  background: 'var(--gold)',
                  color: 'var(--navy)',
                  boxShadow: '0 0 10px rgba(255,215,0,0.45)',
                }}
              >
                {gameState.roundPoints}
              </span>
            </div>
          )}
        </div>

        <ScoreboardTeamCard
          name={config.team2Name}
          score={gameState.team2Score}
          accent="red"
          active={gameState.activeTeam === 2}
          alignRight
        />
      </div>
    </div>
  )
}

function ScoreboardTeamCard({
  name,
  score,
  accent,
  active,
  alignRight = false,
}: {
  name: string
  score: number
  accent: 'blue' | 'red'
  active: boolean
  alignRight?: boolean
}) {
  const accentColor = accent === 'blue' ? '#60a5fa' : 'var(--aep-red)'
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
        alignRight ? 'flex-row-reverse text-right' : ''
      }`}
      style={{
        background: active
          ? 'rgba(255,215,0,0.08)'
          : 'rgba(26,45,74,0.6)',
        boxShadow: active
          ? `inset 0 0 0 2px var(--gold), 0 0 18px rgba(255,215,0,0.25)`
          : `inset 0 0 0 1px ${accent === 'blue' ? 'rgba(96,165,250,0.3)' : 'rgba(200,16,46,0.3)'}`,
      }}
    >
      <div className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'} min-w-0`}>
        <span
          className="font-bungee text-xs tracking-[0.14em] uppercase truncate max-w-[180px]"
          style={{ color: accentColor }}
        >
          {name}
        </span>
        <span className="text-[10px] opacity-50 tracking-[0.22em] uppercase">
          {active ? 'Their Turn' : '\u00A0'}
        </span>
      </div>
      <span
        className="font-bungee text-4xl leading-none tabular-nums"
        style={{ color: 'var(--gold)', textShadow: '0 2px 10px rgba(255,215,0,0.35)' }}
      >
        {score}
      </span>
    </div>
  )
}

function StrikeDots({ strikes }: { strikes: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => {
        const hit = i < strikes
        return (
          <span
            key={i}
            className="font-bungee text-lg leading-none w-6 h-6 flex items-center justify-center rounded"
            style={{
              color: hit ? 'var(--strike-red)' : 'rgba(255,255,255,0.18)',
              background: hit ? 'rgba(255,23,68,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${hit ? 'var(--strike-red)' : 'rgba(255,255,255,0.1)'}`,
              textShadow: hit ? '0 0 8px rgba(255,23,68,0.8)' : 'none',
            }}
          >
            ✕
          </span>
        )
      })}
    </div>
  )
}

function StatusPill({ status }: { status: GameState['status'] }) {
  const color =
    status === 'steal'
      ? 'var(--strike-red)'
      : status === 'final'
      ? 'var(--gold)'
      : status === 'playing'
      ? '#4ade80'
      : 'rgba(255,255,255,0.5)'
  return (
    <span
      className="text-[10px] tracking-[0.18em] uppercase px-2 py-0.5 rounded font-bungee"
      style={{
        color,
        border: `1px solid ${color}`,
        background: 'rgba(0,0,0,0.25)',
      }}
    >
      {status}
    </span>
  )
}

function TeamNameEditor({ config }: { config: { team1Name: string; team2Name: string } }) {
  const [t1, setT1] = useState(config.team1Name)
  const [t2, setT2] = useState(config.team2Name)

  useEffect(() => {
    setT1(config.team1Name)
    setT2(config.team2Name)
  }, [config.team1Name, config.team2Name])

  return (
    <Panel title="Team Names" bodyClassName="flex gap-3">
      <div className="flex-1">
        <label className="text-xs opacity-50">Team 1 Name</label>
        <input
          value={t1}
          onChange={(e) => setT1(e.target.value)}
          onBlur={() => updateConfig({ team1Name: t1 })}
          className="w-full bg-[var(--navy-mid)] rounded-lg px-3 py-2 text-white border border-transparent focus:border-[var(--gold)] outline-none"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs opacity-50">Team 2 Name</label>
        <input
          value={t2}
          onChange={(e) => setT2(e.target.value)}
          onBlur={() => updateConfig({ team2Name: t2 })}
          className="w-full bg-[var(--navy-mid)] rounded-lg px-3 py-2 text-white border border-transparent focus:border-[var(--gold)] outline-none"
        />
      </div>
    </Panel>
  )
}

function StealResolution({
  gameState,
  config,
}: {
  gameState: GameState
  config: { team1Name: string; team2Name: string }
}) {
  const strikingTeam = gameState.activeTeam
  const stealingTeam: 1 | 2 = strikingTeam === 1 ? 2 : 1
  const strikingName = strikingTeam === 1 ? config.team1Name : config.team2Name
  const stealingName = stealingTeam === 1 ? config.team1Name : config.team2Name
  const pts = gameState.roundPoints

  return (
    <div className="bg-[var(--navy-light)] rounded-xl p-4 border-2 border-[var(--strike-red)]/60 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bungee text-lg text-[var(--strike-red)]">⚡ Steal Phase</h3>
        <span className="text-xs opacity-70">{strikingName} struck out • {stealingName} steals</span>
      </div>
      <p className="text-sm opacity-80">
        {stealingName} gets <strong>one</strong> guess. If they pick any remaining correct answer,
        they win the {pts} round points. If they miss, {strikingName} keeps them.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={async () => {
            const award = stealingTeam === 1 ? 'team1Score' : 'team2Score'
            await updateGameState({
              [award]: (stealingTeam === 1 ? gameState.team1Score : gameState.team2Score) + pts,
              roundPoints: 0,
              strikes: 0,
              status: 'playing',
              stealFailedAt: null,
            } as Partial<GameState>)
          }}
          className="py-3 bg-green-700 hover:bg-green-600 rounded-lg font-bungee"
        >
          Steal Successful → {stealingName} (+{pts})
        </button>
        <button
          onClick={async () => {
            const award = strikingTeam === 1 ? 'team1Score' : 'team2Score'
            await updateGameState({
              [award]: (strikingTeam === 1 ? gameState.team1Score : gameState.team2Score) + pts,
              roundPoints: 0,
              strikes: 0,
              status: 'playing',
              stealFailedAt: Date.now(),
            } as Partial<GameState>)
          }}
          className="py-3 bg-[var(--strike-red)] hover:brightness-110 rounded-lg font-bungee"
        >
          Steal Failed → {strikingName} (+{pts})
        </button>
      </div>
    </div>
  )
}

function AudiencePanel({
  currentRoundId,
  team1Name,
  team2Name,
}: {
  currentRoundId: string
  team1Name: string
  team2Name: string
}) {
  const players = useAudiencePlayers()
  const answers = useAudienceAnswersForRound(currentRoundId || null)

  const teamCounts = useMemo(() => countPlayersByTeam(players), [players])
  const answerGroups = useMemo(() => groupAnswersByTeam(answers), [answers])

  const totalPlayers = teamCounts.team1 + teamCounts.team2

  return (
    <Panel
      title={`Audience (${totalPlayers})`}
      action={
        <button
          onClick={async () => {
            if (confirm('Reset the audience? This clears all players, answers, and leads.')) {
              await resetAudience()
            }
          }}
          className="text-xs px-3 py-1 bg-red-900/60 rounded hover:bg-red-800"
        >
          Reset audience
        </button>
      }
      bodyClassName="space-y-3"
    >
      {/* Per-team counts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--navy-mid)] rounded-lg p-3 text-center border border-blue-400/30">
          <p className="text-xs opacity-60 truncate">{team1Name}</p>
          <p className="font-bungee text-3xl text-blue-400">{teamCounts.team1}</p>
          <p className="text-xs opacity-50">fans</p>
        </div>
        <div className="bg-[var(--navy-mid)] rounded-lg p-3 text-center border border-[var(--aep-red)]/30">
          <p className="text-xs opacity-60 truncate">{team2Name}</p>
          <p className="font-bungee text-3xl text-[var(--aep-red)]">{teamCounts.team2}</p>
          <p className="text-xs opacity-50">fans</p>
        </div>
      </div>

      {/* Current round answers, grouped by team */}
      {currentRoundId ? (
        <div className="grid grid-cols-2 gap-3">
          <AnswerList
            title={team1Name}
            accent="text-blue-400"
            rows={answerGroups.team1}
          />
          <AnswerList
            title={team2Name}
            accent="text-[var(--aep-red)]"
            rows={answerGroups.team2}
          />
        </div>
      ) : (
        <p className="text-xs opacity-50 text-center">Select a round to see audience answers.</p>
      )}
    </Panel>
  )
}

function AnswerList({
  title, accent, rows,
}: {
  title: string
  accent: string
  rows: Array<{ text: string; count: number }>
}) {
  return (
    <div className="bg-[var(--navy-mid)]/50 rounded-lg p-2">
      <p className={`text-xs uppercase tracking-widest opacity-70 mb-1 ${accent} truncate`}>{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs opacity-40 py-1">No answers yet</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.text} className="flex items-center justify-between text-sm gap-2">
              <span className="truncate" title={r.text}>{r.text}</span>
              {r.count > 1 && (
                <span className="shrink-0 text-xs bg-[var(--gold)] text-[var(--navy)] rounded-full px-2 py-0.5 font-bold">
                  ×{r.count}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function countPlayersByTeam(players: AudiencePlayers | null) {
  if (!players) return { team1: 0, team2: 0 }
  let t1 = 0
  let t2 = 0
  for (const p of Object.values(players)) {
    if (p.team === 1) t1++
    else if (p.team === 2) t2++
  }
  return { team1: t1, team2: t2 }
}

function groupAnswersByTeam(answers: Record<string, AudienceAnswer> | null | undefined) {
  const counts: { team1: Map<string, number>; team2: Map<string, number> } = {
    team1: new Map(),
    team2: new Map(),
  }
  if (answers) {
    for (const a of Object.values(answers)) {
      const key = a.text.trim().toLowerCase()
      if (!key) continue
      const bucket = a.team === 1 ? counts.team1 : counts.team2
      bucket.set(key, (bucket.get(key) || 0) + 1)
    }
  }
  const toSorted = (m: Map<string, number>) =>
    Array.from(m.entries())
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
  return { team1: toSorted(counts.team1), team2: toSorted(counts.team2) }
}

function ScoreControl({
  label,
  score,
  onAdd,
}: {
  label: string
  score: number
  onAdd: (n: number) => void
}) {
  return (
    <div className="text-center">
      <p className="text-xs opacity-50 mb-1">{label}</p>
      <p className="font-bungee text-2xl text-[var(--gold)] mb-2">{score}</p>
      <div className="flex gap-1 justify-center">
        <button
          onClick={() => onAdd(-10)}
          className="px-3 py-1 bg-red-900/50 rounded text-sm hover:bg-red-800"
        >
          -10
        </button>
        <button
          onClick={() => onAdd(-5)}
          className="px-3 py-1 bg-red-900/50 rounded text-sm hover:bg-red-800"
        >
          -5
        </button>
        <button
          onClick={() => onAdd(5)}
          className="px-3 py-1 bg-green-900/50 rounded text-sm hover:bg-green-800"
        >
          +5
        </button>
        <button
          onClick={() => onAdd(10)}
          className="px-3 py-1 bg-green-900/50 rounded text-sm hover:bg-green-800"
        >
          +10
        </button>
      </div>
    </div>
  )
}
