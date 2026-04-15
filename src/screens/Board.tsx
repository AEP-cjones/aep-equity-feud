import { useGameState, useConfig, useRounds } from '../hooks/useFirebase'
import AepHeader from '../components/AepHeader'
import AnswerCard from '../components/AnswerCard'
import StrikeOverlay from '../components/StrikeOverlay'

export default function Board() {
  const gameState = useGameState()
  const config = useConfig()
  const rounds = useRounds()

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
      <div className="flex-1 flex flex-col px-6 pt-10 pb-6 relative">
        <StrikeOverlay strikes={gameState.strikes} />

        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="font-bungee text-4xl text-[var(--gold)] title-glow">
            {currentRound?.question || 'Waiting for round...'}
          </h2>
        </div>

        {/* Answer Board */}
        <div className="flex-1 flex items-center justify-center">
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

        {/* Round Points */}
        <div className="text-center my-6">
          <span className="font-bungee text-2xl text-white opacity-60">Round Points: </span>
          <span className="font-bungee text-3xl text-[var(--gold)]">{gameState.roundPoints}</span>
        </div>

        {/* Scores row — centered band with owl between the two score cards */}
        <div className="flex items-center justify-center gap-12 self-center">
          <TeamScore
            name={config.team1Name}
            score={gameState.team1Score}
            active={gameState.activeTeam === 1}
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
            side="right"
          />
        </div>
      </div>
    </div>
  )
}

function TitleScreen({ config }: { config: { team1Name: string; team2Name: string } }) {
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
        <h1 className="font-bungee text-8xl text-[var(--gold)] title-glow mt-2">EQUITY FAMILY FEUD</h1>
        <p className="font-bungee text-xl tracking-widest text-white/30 tagline-pulse my-8">SURVEY SAYS...</p>
        <div className="flex gap-10 text-5xl font-bungee items-center">
          <span className="text-blue-400 team-glow-blue">{config.team1Name}</span>
          <span className="text-white/30 text-4xl">VS</span>
          <span className="text-[var(--aep-red)] team-glow-red">{config.team2Name}</span>
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
  side,
}: {
  name: string
  score: number
  active: boolean
  side: 'left' | 'right'
}) {
  const accent = side === 'left' ? 'text-blue-400 team-glow-blue' : 'text-[var(--aep-red)] team-glow-red'
  return (
    <div
      className={`shrink-0 basis-[360px] text-center px-6 py-5 rounded-2xl border-2 transition-all ${
        active
          ? 'bg-[var(--navy-light)] border-[var(--gold)] scale-105 shadow-[0_0_30px_rgba(255,215,0,0.4)]'
          : 'bg-[var(--navy-light)]/60 border-white/10 opacity-80'
      }`}
    >
      <p className={`font-bungee text-2xl mb-2 truncate ${accent}`}>{name}</p>
      <p className="font-bungee text-6xl text-[var(--gold)] title-glow">{score}</p>
    </div>
  )
}
