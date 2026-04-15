import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useGameState, useConfig, useRounds, useAudiencePlayers } from '../hooks/useFirebase'
import AepHeader from '../components/AepHeader'
import AnswerCard from '../components/AnswerCard'
import StrikeOverlay from '../components/StrikeOverlay'
import type { AudiencePlayers } from '../types'

export default function Board() {
  const gameState = useGameState()
  const config = useConfig()
  const rounds = useRounds()
  const players = useAudiencePlayers()
  const audienceCounts = useMemo(() => countByTeam(players), [players])

  if (!gameState || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl opacity-50">Connecting...</p>
      </div>
    )
  }

  if (gameState.status === 'title') {
    return <TitleScreen config={config} />
  }

  if (gameState.status === 'final') {
    return <FinalScreen gameState={gameState} config={config} />
  }

  const currentRound = rounds?.[gameState.currentRound]

  return (
    <div className="min-h-screen flex flex-col title-bg">
      <AepHeader />
      <div className="flex-1 flex flex-col px-6 pb-6 relative" style={{ paddingTop: '3rem' }}>
        <StrikeOverlay strikes={gameState.strikes} />

        {/* Question — "SURVEY SAYS..." tagline banner over the question */}
        <div className="text-center" style={{ marginBottom: '2.5rem' }}>
          <p className="font-bungee text-sm tracking-widest text-white/30 tagline-pulse" style={{ marginBottom: '0.5rem' }}>
            SURVEY SAYS…
          </p>
          <h2 className="font-bungee text-4xl text-[var(--gold)] title-glow">
            {currentRound?.question || 'Waiting for round...'}
          </h2>
        </div>

        {/* Answer Board — sticks just below the question, not vertically centered */}
        <div className="flex-1 flex items-start justify-center">
          <div className="w-full max-w-4xl">
            {currentRound?.answers ? (
              <div className="grid grid-cols-1 gap-3">
                {currentRound.answers.map((answer, i) => (
                  <AnswerCard key={i} answer={answer} index={i} large />
                ))}
              </div>
            ) : (
              <p className="text-center opacity-50 text-xl">No round loaded</p>
            )}
          </div>
        </div>

        {/* Round Points — gold pill */}
        <div className="text-center" style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>
          <RoundPointsPill value={gameState.roundPoints} />
        </div>

        {/* Scores row — centered band with owl between the two score cards */}
        <div className="flex items-center justify-center gap-12 self-center">
          <TeamScore
            name={config.team1Name}
            score={gameState.team1Score}
            active={gameState.activeTeam === 1}
            audienceCount={audienceCounts.team1}
            side="left"
          />
          <div className="flex flex-col items-center shrink-0">
            <img
              src="/Game_Show_Owl.webp"
              alt="Equity Family Feud Owl"
              className="owl-idle object-contain"
              style={{ width: 180, height: 180, filter: 'drop-shadow(0 0 40px rgba(255,200,50,0.45)) drop-shadow(0 0 80px rgba(172,34,40,0.35))' }}
            />
          </div>
          <TeamScore
            name={config.team2Name}
            score={gameState.team2Score}
            active={gameState.activeTeam === 2}
            audienceCount={audienceCounts.team2}
            side="right"
          />
        </div>
      </div>
    </div>
  )
}

function TitleScreen({ config }: { config: { team1Name: string; team2Name: string } }) {
  const playUrl = typeof window !== 'undefined' ? `${window.location.origin}/play` : '/play'
  return (
    <div className="min-h-screen flex flex-col title-bg">
      <AepHeader />
      <div className="flex-1 flex flex-col items-center pt-16 pb-10">
        <img
          src="/Game_Show_Owl.webp"
          alt="Equity Family Feud Owl"
          className="owl-idle object-contain"
          style={{ width: 480, height: 380, filter: 'drop-shadow(0 0 60px rgba(255,200,50,0.5)) drop-shadow(0 0 100px rgba(172,34,40,0.4))' }}
        />
        <h1 className="font-bungee text-8xl text-[var(--gold)] title-glow mt-16">EQUITY FAMILY FEUD</h1>
        <p className="font-bungee text-xl tracking-widest text-white/30 tagline-pulse mb-8">SURVEY SAYS...</p>
        <div className="flex gap-10 text-5xl font-bungee items-center">
          <span className="text-blue-400 team-glow-blue">{config.team1Name}</span>
          <span className="text-white/30 text-4xl">VS</span>
          <span className="text-[var(--aep-red)] team-glow-red">{config.team2Name}</span>
        </div>
      </div>

      {/* Floating QR code — bottom-right of title screen */}
      <div
        style={{ position: 'absolute', right: 40, bottom: 40 }}
        className="flex flex-col items-center gap-3"
      >
        <p className="font-bungee text-sm tracking-widest text-white/60 tagline-pulse">📱 SCAN TO PLAY</p>
        <div className="bg-white p-3 rounded-2xl" style={{ boxShadow: '0 0 30px rgba(255,255,255,0.15)' }}>
          <QRCodeSVG value={playUrl} size={160} />
        </div>
      </div>
    </div>
  )
}

function FinalScreen({
  gameState,
  config,
}: {
  gameState: { team1Score: number; team2Score: number }
  config: { team1Name: string; team2Name: string }
}) {
  const winner =
    gameState.team1Score > gameState.team2Score
      ? config.team1Name
      : gameState.team2Score > gameState.team1Score
        ? config.team2Name
        : "It's a tie!"
  const isTie = gameState.team1Score === gameState.team2Score

  return (
    <div className="min-h-screen flex flex-col">
      <AepHeader />
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <img
          src="/Game_Show_Owl.webp"
          alt="Equity Family Feud Owl"
          className="owl-idle object-contain"
          style={{ width: 420, height: 420, filter: 'drop-shadow(0 0 40px rgba(255,200,50,0.45)) drop-shadow(0 0 80px rgba(172,34,40,0.35))' }}
        />
        <h1 className="font-bungee text-6xl text-[var(--gold)] title-glow">FINAL SCORE</h1>
        <div className="flex gap-16 items-center">
          <div className="text-center">
            <p className="font-bungee text-3xl text-blue-400 mb-2">{config.team1Name}</p>
            <p className="font-bungee text-6xl text-white">{gameState.team1Score}</p>
          </div>
          <span className="font-bungee text-4xl text-white opacity-30">—</span>
          <div className="text-center">
            <p className="font-bungee text-3xl text-[var(--aep-red)] mb-2">{config.team2Name}</p>
            <p className="font-bungee text-6xl text-white">{gameState.team2Score}</p>
          </div>
        </div>
        {!isTie && (
          <p className="font-bungee text-5xl text-[var(--gold)] mt-4 title-glow">
            {winner} Wins!
          </p>
        )}
        {isTie && (
          <p className="font-bungee text-5xl text-[var(--gold)] mt-4 title-glow">It's a Tie!</p>
        )}
      </div>
    </div>
  )
}

function TeamScore({
  name,
  score,
  active,
  audienceCount,
  side,
}: {
  name: string
  score: number
  active: boolean
  audienceCount: number
  side: 'left' | 'right'
}) {
  const accent = side === 'left' ? 'text-blue-400 team-glow-blue' : 'text-[var(--aep-red)] team-glow-red'
  const pop = usePopOnChange(score)
  return (
    <div
      className={`shrink-0 basis-[360px] text-center px-6 py-5 rounded-2xl border-2 transition-all ${
        active
          ? 'bg-[var(--navy-light)] border-[var(--gold)] scale-105 shadow-[0_0_30px_rgba(255,215,0,0.4)]'
          : 'bg-[var(--navy-light)]/60 border-white/10 opacity-80'
      }`}
    >
      <p className={`font-bungee text-2xl mb-2 truncate ${accent}`}>{name}</p>
      <p className={`font-bungee text-6xl text-[var(--gold)] title-glow ${pop ? 'score-pop' : ''}`}>
        {score}
      </p>
      <p className="text-xs opacity-60 tracking-widest uppercase mt-2">
        👥 {audienceCount} {audienceCount === 1 ? 'fan' : 'fans'}
      </p>
    </div>
  )
}

function RoundPointsPill({ value }: { value: number }) {
  const pop = usePopOnChange(value)
  return (
    <span
      className="inline-flex items-center gap-3 rounded-full border-2 font-bungee"
      style={{
        padding: '0.5rem 1.5rem',
        borderColor: 'rgba(255, 215, 0, 0.5)',
        background: 'rgba(255, 215, 0, 0.08)',
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.15)',
      }}
    >
      <span className="text-base text-white/60 tracking-widest uppercase">Round Points</span>
      <span className={`text-3xl text-[var(--gold)] title-glow ${pop ? 'score-pop' : ''}`}>{value}</span>
    </span>
  )
}

/**
 * Returns true for ~400ms whenever `value` changes, so the caller can
 * apply the .score-pop animation class. First render returns false.
 */
function usePopOnChange(value: number): boolean {
  const [pop, setPop] = useState(false)
  const prev = useRef(value)
  useEffect(() => {
    if (value === prev.current) return
    prev.current = value
    setPop(true)
    const t = setTimeout(() => setPop(false), 400)
    return () => clearTimeout(t)
  }, [value])
  return pop
}

function countByTeam(players: AudiencePlayers | null): { team1: number; team2: number } {
  if (!players) return { team1: 0, team2: 0 }
  let t1 = 0
  let t2 = 0
  for (const p of Object.values(players)) {
    if (p.team === 1) t1++
    else if (p.team === 2) t2++
  }
  return { team1: t1, team2: t2 }
}
