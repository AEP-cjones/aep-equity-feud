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
      <div
        className="mx-auto w-full"
        style={{ padding: '20px 24px', maxWidth: 1200 }}
      >
        {/* Steal banner stays full-width, above the grid, when active */}
        {gameState.status === 'steal' && (
          <div style={{ marginBottom: 16 }}>
            <StealResolution gameState={gameState} config={config} />
          </div>
        )}

        <div className="host-grid">
          {/* LEFT: round picker, reveal tiles, primary actions */}
          <div className="host-col">
            <Panel title="Round Select">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {roundKeys.map((key) => {
                  const isCurrent = gameState.currentRound === key
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectRound(key, rounds[key])}
                      className="font-bungee rounded-lg transition-all hover:brightness-110 active:scale-[0.98]"
                      style={{
                        padding: '10px 18px',
                        fontSize: 15,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        background: isCurrent
                          ? 'linear-gradient(180deg, var(--gold) 0%, var(--gold-dark) 100%)'
                          : 'var(--navy-mid)',
                        color: isCurrent ? 'var(--navy)' : 'white',
                        border: `1px solid ${isCurrent ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isCurrent
                          ? '0 0 14px rgba(255,215,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                      }}
                    >
                      {key}
                    </button>
                  )
                })}
              </div>
              {roundKeys.length === 0 && (
                <p style={{ opacity: 0.5 }}>
                  No rounds created. Go to /admin to add rounds.
                </p>
              )}
            </Panel>

            {currentRound && (
              <Panel title="Reveal Answers">
                <h4
                  className="font-bungee"
                  style={{
                    fontSize: 22,
                    color: 'var(--gold)',
                    marginBottom: 4,
                    lineHeight: 1.2,
                  }}
                >
                  {currentRound.question}
                </h4>
                <p style={{ fontSize: 13, opacity: 0.55, marginBottom: 14 }}>
                  Tap an answer to reveal it on the board
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {currentRound.answers.map((answer, i) => (
                    <AnswerRevealTile
                      key={i}
                      index={i}
                      text={answer.text}
                      points={answer.points}
                      revealed={answer.revealed}
                      onClick={() =>
                        handleRevealAnswer(gameState.currentRound, i, answer.points, gameState)
                      }
                    />
                  ))}
                </div>
              </Panel>
            )}

            <Panel title="Actions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => handleStrike(gameState)}
                  disabled={gameState.strikes >= 3}
                  className="font-bungee rounded-xl transition-all hover:brightness-110 active:scale-[0.99]"
                  style={{
                    padding: '18px 16px',
                    fontSize: 26,
                    letterSpacing: '0.06em',
                    background: 'var(--strike-red)',
                    color: 'white',
                    opacity: gameState.strikes >= 3 ? 0.3 : 1,
                    cursor: gameState.strikes >= 3 ? 'not-allowed' : 'pointer',
                    boxShadow:
                      '0 6px 18px rgba(255,23,68,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  STRIKE! ({gameState.strikes}/3)
                </button>

                {gameState.roundPoints > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        updateGameState({
                          team1Score: gameState.team1Score + gameState.roundPoints,
                          roundPoints: 0,
                        })
                      }}
                      className="font-bungee rounded-lg transition-all hover:brightness-110"
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        fontSize: 14,
                        background: '#2563eb',
                        color: 'white',
                      }}
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
                      className="font-bungee rounded-lg transition-all hover:brightness-110"
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        fontSize: 14,
                        background: 'var(--aep-red)',
                        color: 'white',
                      }}
                    >
                      Award {gameState.roundPoints} to {config.team2Name}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => updateGameState({ status: 'title' })}
                    className="rounded-lg transition-all hover:brightness-110"
                    style={{
                      padding: '10px 16px',
                      fontSize: 14,
                      background: 'var(--navy-mid)',
                      color: 'white',
                    }}
                  >
                    Title Screen
                  </button>
                  <button
                    onClick={() => updateGameState({ status: 'final' })}
                    className="font-bungee rounded-lg transition-all hover:brightness-110"
                    style={{
                      padding: '10px 16px',
                      fontSize: 14,
                      background: 'var(--gold)',
                      color: 'var(--navy)',
                    }}
                  >
                    Final Scores
                  </button>
                  <button
                    onClick={() => handleResetGame()}
                    className="rounded-lg transition-all hover:brightness-110"
                    style={{
                      padding: '10px 16px',
                      fontSize: 14,
                      background: '#7f1d1d',
                      color: 'white',
                    }}
                  >
                    Reset Game
                  </button>
                </div>
              </div>
            </Panel>
          </div>

          {/* RIGHT: live state — teams, audience, names */}
          <div className="host-col">
            <Panel title="Teams">
              <div className="grid grid-cols-2 gap-3">
                <TeamControlCard
                  name={config.team1Name}
                  score={gameState.team1Score}
                  accent="blue"
                  active={gameState.activeTeam === 1}
                  onActivate={() => updateGameState({ activeTeam: 1 })}
                  onAdd={(n) =>
                    updateGameState({ team1Score: gameState.team1Score + n })
                  }
                />
                <TeamControlCard
                  name={config.team2Name}
                  score={gameState.team2Score}
                  accent="red"
                  active={gameState.activeTeam === 2}
                  onActivate={() => updateGameState({ activeTeam: 2 })}
                  onAdd={(n) =>
                    updateGameState({ team2Score: gameState.team2Score + n })
                  }
                />
              </div>
            </Panel>

            <AudiencePanel
              currentRoundId={gameState.currentRound}
              team1Name={config.team1Name}
              team2Name={config.team2Name}
            />

            <TeamNameEditor config={config} />
          </div>
        </div>
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
  // When strikes===2, the next empty dot pulses to warn "one more ends it".
  // When strikes===3, all three dots glow harder.
  const isMax = strikes >= 3
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => {
        const hit = i < strikes
        const isWarning = !hit && strikes === 2 && i === 2
        return (
          <span
            key={i}
            className={`font-bungee text-lg leading-none w-6 h-6 flex items-center justify-center rounded ${
              isWarning ? 'strike-dot-warn' : ''
            }`}
            style={{
              color: hit ? 'var(--strike-red)' : 'rgba(255,255,255,0.18)',
              background: hit ? 'rgba(255,23,68,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${hit ? 'var(--strike-red)' : 'rgba(255,255,255,0.1)'}`,
              textShadow: hit
                ? isMax
                  ? '0 0 14px rgba(255,23,68,1), 0 0 6px rgba(255,23,68,0.8)'
                  : '0 0 8px rgba(255,23,68,0.8)'
                : 'none',
              boxShadow:
                hit && isMax ? '0 0 18px rgba(255,23,68,0.5)' : 'none',
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
    <div
      className="rounded-xl steal-pulse steal-entrance"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,23,68,0.18) 0%, rgba(20,8,12,0.95) 100%)',
        padding: 16,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <h3
          className="font-bungee tracking-widest uppercase flex items-center"
          style={{ color: 'var(--strike-red)', fontSize: 18, gap: 8 }}
        >
          <span style={{ fontSize: 22 }}>⚡</span> Steal Phase
        </h3>
        <span
          className="font-bungee tracking-[0.18em] uppercase"
          style={{ fontSize: 11, opacity: 0.8 }}
        >
          {strikingName} struck out · {stealingName} steals
        </span>
      </div>
      <p className="text-sm" style={{ opacity: 0.85, marginBottom: 12 }}>
        {stealingName} gets <strong style={{ color: 'var(--gold)' }}>one</strong> guess. If
        they pick any remaining correct answer, they win the{' '}
        <strong style={{ color: 'var(--gold)' }}>{pts}</strong> round points. If they miss,{' '}
        {strikingName} keeps them.
      </p>
      <div className="grid grid-cols-2" style={{ gap: 12 }}>
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
          className="rounded-xl font-bungee tracking-widest uppercase transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            padding: '14px 12px',
            fontSize: 14,
            background:
              'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
            color: 'white',
            border: '2px solid #4ade80',
            boxShadow:
              '0 4px 14px rgba(74,222,128,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          ✓ Steal Successful
          <div className="font-bungee" style={{ fontSize: 11, marginTop: 4, opacity: 0.95 }}>
            → {stealingName} +{pts}
          </div>
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
          className="rounded-xl font-bungee tracking-widest uppercase transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            padding: '14px 12px',
            fontSize: 14,
            background:
              'linear-gradient(180deg, var(--strike-red) 0%, #b00027 100%)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.25)',
            boxShadow:
              '0 4px 14px rgba(255,23,68,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          ✕ Steal Failed
          <div className="font-bungee" style={{ fontSize: 11, marginTop: 4, opacity: 0.95 }}>
            → {strikingName} +{pts}
          </div>
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
    >
      {/* Per-team counts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AudienceCountCard name={team1Name} count={teamCounts.team1} accent="#60a5fa" />
        <AudienceCountCard name={team2Name} count={teamCounts.team2} accent="var(--aep-red)" />
      </div>

      {/* Current round answers, grouped by team */}
      {currentRoundId ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginTop: 12,
          }}
        >
          <AnswerList title={team1Name} accent="#60a5fa" rows={answerGroups.team1} />
          <AnswerList title={team2Name} accent="var(--aep-red)" rows={answerGroups.team2} />
        </div>
      ) : (
        <p style={{ fontSize: 12, opacity: 0.5, textAlign: 'center', marginTop: 12 }}>
          Select a round to see audience answers.
        </p>
      )}
    </Panel>
  )
}

function AudienceCountCard({
  name,
  count,
  accent,
}: {
  name: string
  count: number
  accent: string
}) {
  return (
    <div
      style={{
        background: 'var(--navy-mid)',
        borderRadius: 10,
        padding: '12px 10px',
        textAlign: 'center',
        border: `1px solid ${accent === '#60a5fa' ? 'rgba(96,165,250,0.3)' : 'rgba(200,16,46,0.3)'}`,
      }}
    >
      <p
        style={{
          fontSize: 11,
          opacity: 0.7,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </p>
      <p
        className="font-bungee tabular-nums"
        style={{ fontSize: 32, lineHeight: 1.1, color: accent, marginTop: 4 }}
      >
        {count}
      </p>
      <p style={{ fontSize: 11, opacity: 0.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        fans
      </p>
    </div>
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
    <div
      style={{
        background: 'rgba(26,45,74,0.5)',
        borderRadius: 10,
        padding: 10,
      }}
    >
      <p
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          opacity: 0.8,
          marginBottom: 6,
          color: accent,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </p>
      {rows.length === 0 ? (
        <p style={{ fontSize: 12, opacity: 0.4, padding: '4px 0' }}>No answers yet</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
          {rows.map((r) => (
            <li
              key={r.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: 13,
              }}
            >
              <span
                title={r.text}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {r.text}
              </span>
              {r.count > 1 && (
                <span
                  className="font-bungee"
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    background: 'var(--gold)',
                    color: 'var(--navy)',
                    borderRadius: 999,
                    padding: '2px 8px',
                  }}
                >
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

function AnswerRevealTile({
  index,
  text,
  points,
  revealed,
  onClick,
}: {
  index: number
  text: string
  points: number
  revealed: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl overflow-hidden transition-all hover:brightness-110 active:scale-[0.99] text-left"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: revealed
          ? 'linear-gradient(180deg, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0.06) 100%)'
          : 'var(--navy-mid)',
        boxShadow: revealed
          ? 'inset 0 0 0 2px var(--gold), 0 0 18px rgba(255,215,0,0.25)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        minHeight: 60,
      }}
    >
      {/* Number badge */}
      <div
        style={{
          width: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: revealed
            ? 'linear-gradient(180deg, var(--gold) 0%, var(--gold-dark) 100%)'
            : 'rgba(0,0,0,0.25)',
          color: revealed ? 'var(--navy)' : 'var(--gold)',
          boxShadow: revealed
            ? 'inset -1px 0 0 rgba(0,0,0,0.2)'
            : 'inset -1px 0 0 rgba(255,255,255,0.04)',
        }}
      >
        <span
          className="font-bungee"
          style={{
            fontSize: 28,
            lineHeight: 1,
            textShadow: revealed ? 'none' : '0 0 12px rgba(255,215,0,0.4)',
          }}
        >
          {index + 1}
        </span>
      </div>

      {/* Answer text */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          padding: '12px 16px',
        }}
      >
        <span
          className="font-bungee"
          style={{
            fontSize: 18,
            letterSpacing: '0.04em',
            color: revealed ? 'var(--gold)' : 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
        {revealed && (
          <span
            style={{ marginLeft: 8, fontSize: 16, color: 'var(--gold)' }}
            aria-hidden
          >
            ✓
          </span>
        )}
      </div>

      {/* Points pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingRight: 14,
          flexShrink: 0,
        }}
      >
        <span
          className="font-bungee tabular-nums"
          style={{
            fontSize: 18,
            padding: '6px 14px',
            borderRadius: 999,
            background: revealed ? 'rgba(10,22,40,0.85)' : 'var(--navy)',
            color: 'var(--gold)',
            border: '1px solid rgba(255,215,0,0.4)',
            minWidth: 70,
            textAlign: 'center',
          }}
        >
          {points}
        </span>
      </div>
    </button>
  )
}

function TeamControlCard({
  name,
  score,
  accent,
  active,
  onActivate,
  onAdd,
}: {
  name: string
  score: number
  accent: 'blue' | 'red'
  active: boolean
  onActivate: () => void
  onAdd: (n: number) => void
}) {
  const accentColor = accent === 'blue' ? '#60a5fa' : 'var(--aep-red)'
  const accentBg = accent === 'blue' ? 'rgba(96,165,250,0.12)' : 'rgba(200,16,46,0.12)'
  const accentRing = accent === 'blue' ? 'rgba(96,165,250,0.4)' : 'rgba(200,16,46,0.4)'

  return (
    <div
      className="rounded-xl overflow-hidden transition-all relative"
      style={{
        background: active ? accentBg : 'var(--navy-mid)',
        boxShadow: active
          ? `inset 0 0 0 2px var(--gold), 0 0 20px rgba(255,215,0,0.22)`
          : `inset 0 0 0 1px ${accentRing}`,
      }}
    >
      {/* Tap header to set active */}
      <button
        onClick={onActivate}
        className="w-full hover:brightness-125 transition-all text-center"
        style={{
          padding: '10px 12px',
          background: `linear-gradient(180deg, ${accentColor} 0%, color-mix(in srgb, ${accentColor} 65%, black) 100%)`,
          color: accent === 'blue' ? '#0a1628' : 'white',
        }}
      >
        <div
          className="font-bungee uppercase"
          style={{
            fontSize: 15,
            letterSpacing: '0.10em',
            lineHeight: 1.1,
          }}
        >
          {name}
        </div>
        <div
          className="font-bungee uppercase"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            opacity: active ? 0.9 : 0.75,
            marginTop: 2,
          }}
        >
          {active ? '★ Their Turn' : 'Tap to activate'}
        </div>
      </button>

      <div style={{ padding: '14px 12px 12px 12px', textAlign: 'center' }}>
        <p
          className="font-bungee tabular-nums"
          style={{
            fontSize: 44,
            lineHeight: 1,
            color: 'var(--gold)',
            textShadow: '0 2px 10px rgba(255,215,0,0.35)',
          }}
        >
          {score}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            marginTop: 12,
          }}
        >
          <StepperButton sign="-" onClick={() => onAdd(-10)}>−10</StepperButton>
          <StepperButton sign="-" onClick={() => onAdd(-5)}>−5</StepperButton>
          <StepperButton sign="+" onClick={() => onAdd(5)}>+5</StepperButton>
          <StepperButton sign="+" onClick={() => onAdd(10)}>+10</StepperButton>
        </div>
      </div>
    </div>
  )
}

function StepperButton({
  sign,
  onClick,
  children,
}: {
  sign: '+' | '-'
  onClick: () => void
  children: React.ReactNode
}) {
  const isPlus = sign === '+'
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="rounded-md font-bungee transition-all active:scale-95 hover:brightness-125"
      style={{
        padding: '8px 10px',
        fontSize: 14,
        letterSpacing: '0.05em',
        background: isPlus ? 'rgba(22,101,52,0.55)' : 'rgba(127,29,29,0.55)',
        border: `1px solid ${isPlus ? 'rgba(74,222,128,0.45)' : 'rgba(248,113,113,0.45)'}`,
        color: 'white',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </button>
  )
}
