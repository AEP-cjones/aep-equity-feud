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
        <RoundIntroSplash roundId={gameState.currentRound} round={currentRound} />
        <StealFailedOverlay
          stealFailedAt={gameState.stealFailedAt ?? null}
          originalTeamName={gameState.activeTeam === 1 ? config.team1Name : config.team2Name}
        />

        {/* Steal phase banner OR normal question header */}
        {gameState.status === 'steal' ? (
          <StealBanner
            stealingTeamName={gameState.activeTeam === 1 ? config.team2Name : config.team1Name}
            stealingSide={gameState.activeTeam === 1 ? 'right' : 'left'}
          />
        ) : (
          <div className="text-center" style={{ marginBottom: '2.5rem' }}>
            <p className="font-bungee text-sm tracking-widest text-white/30 tagline-pulse" style={{ marginBottom: '0.5rem' }}>
              SURVEY SAYS…
            </p>
            <h2 className="font-bungee text-4xl text-[var(--gold)] title-glow">
              {currentRound?.question || 'Waiting for round...'}
            </h2>
          </div>
        )}

        {/* Answer Board — 2-column layout in a marquee-light stage */}
        <div className="flex items-start justify-center">
          <div className="w-full max-w-5xl">
            <MarqueeFrame>
              <div
                style={{
                  border: '2px solid rgba(255, 215, 0, 0.28)',
                  borderRadius: '1.25rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(180deg, rgba(13,33,55,0.55), rgba(10,22,40,0.75))',
                  boxShadow: 'inset 0 0 40px rgba(255,215,0,0.05), 0 0 30px rgba(0,0,0,0.35)',
                }}
              >
                {currentRound?.answers ? (
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gridTemplateRows: `repeat(${Math.ceil(currentRound.answers.length / 2)}, minmax(0, 1fr))`,
                      gridAutoFlow: 'column',
                    }}
                  >
                    {currentRound.answers.map((answer, i) => (
                      <AnswerCard key={i} answer={answer} index={i} large />
                    ))}
                  </div>
                ) : (
                  <p className="text-center opacity-50 text-xl py-8">No round loaded</p>
                )}
              </div>
            </MarqueeFrame>
          </div>
        </div>

        {/* Round Points — gold pill */}
        <div className="text-center" style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>
          <RoundPointsPill value={gameState.roundPoints} />
        </div>

        {/* Scores row — centered band with owl between the two score cards.
            During the steal phase the "THEIR TURN" pointer follows the
            stealing team (not the one that struck out). */}
        <div className="flex items-center justify-center gap-12 self-center" style={{ marginTop: '2rem' }}>
          <TeamScore
            name={config.team1Name}
            score={gameState.team1Score}
            active={
              gameState.status === 'steal'
                ? gameState.activeTeam !== 1
                : gameState.activeTeam === 1
            }
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
            active={
              gameState.status === 'steal'
                ? gameState.activeTeam !== 2
                : gameState.activeTeam === 2
            }
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
    <div className="shrink-0 basis-[360px] relative">
      {active && (
        <p
          className="absolute left-0 right-0 text-center font-bungee tracking-widest text-[var(--gold)] turn-pointer pointer-events-none"
          style={{ top: '-1.6rem', fontSize: '0.75rem', letterSpacing: '0.25em' }}
        >
          THEIR TURN ▼
        </p>
      )}
      <div
        className={`text-center px-6 py-5 rounded-2xl border-2 transition-all ${
          active
            ? 'bg-[var(--navy-light)] border-[var(--gold)] scale-105 shadow-[0_0_40px_rgba(255,215,0,0.55)]'
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
    </div>
  )
}

/**
 * Banner shown above the answer board during the steal phase.
 * Takes the place of the "SURVEY SAYS / question" block.
 */
function StealBanner({
  stealingTeamName,
  stealingSide,
}: {
  stealingTeamName: string
  stealingSide: 'left' | 'right'
}) {
  const accent = stealingSide === 'left' ? 'text-blue-400 team-glow-blue' : 'text-[var(--aep-red)] team-glow-red'
  return (
    <div className="text-center" style={{ marginBottom: '2.5rem' }}>
      <p className="font-bungee text-sm tracking-widest text-white/40 tagline-pulse" style={{ marginBottom: '0.5rem' }}>
        ⚡ STEAL ⚡
      </p>
      <h2 className="font-bungee text-4xl title-glow">
        <span className={accent}>{stealingTeamName}</span>
        <span className="text-[var(--gold)]"> — One Guess to Steal It</span>
      </h2>
    </div>
  )
}

/**
 * Full-screen overlay that fires briefly when `stealFailedAt` is set
 * within the last ~3 seconds. Reuses the existing strike-X animation
 * plus a "STEAL FAILED" banner and the original team name.
 *
 * The timestamp-based trigger means any late state read from Firebase
 * naturally self-expires — no cleanup needed on the Host side.
 */
function StealFailedOverlay({
  stealFailedAt,
  originalTeamName,
}: {
  stealFailedAt: number | null
  originalTeamName: string
}) {
  const DURATION_MS = 2800
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!stealFailedAt) {
      setShow(false)
      return
    }
    const age = Date.now() - stealFailedAt
    if (age >= DURATION_MS) {
      setShow(false)
      return
    }
    setShow(true)
    const t = setTimeout(() => setShow(false), DURATION_MS - age)
    return () => clearTimeout(t)
  }, [stealFailedAt])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 splash-fade pointer-events-none"
      style={{ background: 'rgba(10, 22, 40, 0.78)', backdropFilter: 'blur(4px)' }}
    >
      <div className="screen-shake flex gap-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="strike-x text-[160px] font-bungee text-[var(--strike-red)] leading-none"
            style={{
              textShadow: '0 0 40px rgba(255, 23, 68, 0.8), 0 0 80px rgba(255, 23, 68, 0.4)',
              animationDelay: `${i * 0.08}s`,
            }}
          >
            X
          </div>
        ))}
      </div>
      <h1 className="font-bungee text-6xl text-[var(--strike-red)] splash-scale"
        style={{ textShadow: '0 0 30px rgba(255,23,68,0.6)' }}
      >
        STEAL FAILED
      </h1>
      <p className="font-bungee text-2xl text-white splash-sub">
        Points to <span className="text-[var(--gold)]">{originalTeamName}</span>
      </p>
    </div>
  )
}

/**
 * Vegas-marquee chase lights wrapped around the answer board. Two concentric
 * rings of gold bulbs sit just outside the inner stage border. Each bulb is
 * placed so its center sits the requested `offset` pixels outside the edge
 * (NOT using translate(-50%) which would pull the right/bottom bulbs inside
 * the container). The two rings use different phase offsets and slightly
 * different loop durations so the chase drifts and layers.
 */
function MarqueeFrame({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const measure = () => {
      const r = el.getBoundingClientRect()
      setDims({ w: r.width, h: r.height })
    }
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="relative">
      {dims && (
        <>
          {/* Inner ring — closer to stage, bigger bulbs, ~54px spacing */}
          <MarqueeRing dims={dims} offset={12} spacingPx={54} size={10} loopSeconds={2} />
          {/* Outer ring — further out, smaller bulbs, ~58px spacing, slightly
              different loop length so the chase drifts against the inner ring. */}
          <MarqueeRing dims={dims} offset={28} spacingPx={58} size={7} loopSeconds={2.4} />
        </>
      )}
      {children}
    </div>
  )
}

/**
 * A single ring of chase bulbs around the perimeter. `offset` pushes the
 * bulb centers that many pixels outside the container edge. `phase` shifts
 * each bulb along its edge by that fraction of one slot (0 = slot-centered,
 * 0.5 = half a slot, landing between the inner ring's bulbs).
 */
/**
 * Places bulbs at uniform arc-length intervals around the expanded rectangle
 * (stage + offset in each direction). Corners are naturally covered because
 * the perimeter is treated as a single continuous loop. Spacing is
 * near-uniform regardless of stage aspect ratio.
 */
function MarqueeRing({
  dims,
  offset,
  spacingPx,
  size,
  loopSeconds,
}: {
  dims: { w: number; h: number }
  offset: number
  spacingPx: number
  size: number
  loopSeconds: number
}) {
  const half = size / 2
  // Expand the rectangle outward by `offset` so bulbs sit outside the stage
  // border. The bulb path traces this expanded rectangle's perimeter.
  const W = dims.w + 2 * offset
  const H = dims.h + 2 * offset
  const perimeter = 2 * (W + H)
  const n = Math.max(4, Math.round(perimeter / spacingPx))
  const step = perimeter / n

  // Convert an arc-length position d (0..perimeter) clockwise from TL into
  // (left, top) coordinates for the bulb center, measured from the stage
  // container's top-left corner. Negative values mean outside the stage.
  const project = (d: number): { left: number; top: number } => {
    if (d < W) return { left: -offset + d, top: -offset }
    d -= W
    if (d < H) return { left: dims.w + offset, top: -offset + d }
    d -= H
    if (d < W) return { left: dims.w + offset - d, top: dims.h + offset }
    d -= W
    return { left: -offset, top: dims.h + offset - d }
  }

  const bulbs = Array.from({ length: n }, (_, i) => {
    const { left, top } = project(i * step)
    return {
      key: i,
      idx: i,
      style: {
        width: size,
        height: size,
        position: 'absolute' as const,
        borderRadius: '50%',
        pointerEvents: 'none' as const,
        left: left - half,
        top: top - half,
      },
    }
  })

  return (
    <>
      {bulbs.map((b) => (
        <span
          key={b.key}
          className="marquee-bulb"
          style={{
            ...b.style,
            animation: `bulbChase ${loopSeconds}s ease-in-out infinite`,
            animationDelay: `${(b.idx / n) * loopSeconds}s`,
          }}
        />
      ))}
    </>
  )
}

/**
 * Briefly overlays a "ROUND X" splash + question reveal when the current
 * round changes. Does NOT fire on initial mount (useRef seeds with the
 * first roundId seen), only on subsequent transitions — so a page reload
 * mid-game doesn't re-show the splash.
 */
function RoundIntroSplash({
  roundId,
  round,
}: {
  roundId: string
  round: { question: string } | undefined
}) {
  const [show, setShow] = useState(false)
  const [label, setLabel] = useState('')
  const [question, setQuestion] = useState('')
  const prev = useRef(roundId)

  useEffect(() => {
    if (roundId === prev.current) return
    prev.current = roundId
    if (!roundId) {
      setShow(false)
      return
    }
    const num = /round(\d+)/i.exec(roundId)?.[1]
    setLabel(num ? `ROUND ${num}` : roundId.toUpperCase())
    setQuestion(round?.question || '')
    setShow(true)
    const t = setTimeout(() => setShow(false), 1800)
    return () => clearTimeout(t)
  }, [roundId, round?.question])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 splash-fade"
      style={{ background: 'rgba(10, 22, 40, 0.82)', backdropFilter: 'blur(6px)' }}
    >
      <p className="font-bungee text-lg tracking-widest text-white/50 splash-sub">NEXT UP</p>
      <h1 className="font-bungee text-7xl text-[var(--gold)] title-glow splash-scale">{label}</h1>
      {question && (
        <p className="font-bungee text-2xl text-white max-w-3xl text-center px-8 splash-sub">
          {question}
        </p>
      )}
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
