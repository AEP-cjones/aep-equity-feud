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
    <div className="min-h-screen flex flex-col">
      <AepHeader />
      <div className="flex-1 flex flex-col p-6 relative">
        <StrikeOverlay strikes={gameState.strikes} />

        {/* Question */}
        <div className="text-center mb-6">
          <h2 className="font-bungee text-4xl text-[var(--gold)] mb-2">
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
        <div className="text-center my-4">
          <span className="font-bungee text-2xl text-white opacity-60">Round Points: </span>
          <span className="font-bungee text-3xl text-[var(--gold)]">{gameState.roundPoints}</span>
        </div>

        {/* Scores */}
        <div className="flex justify-between items-end px-8">
          <TeamScore
            name={config.team1Name}
            score={gameState.team1Score}
            active={gameState.activeTeam === 1}
          />
          <div className="flex flex-col items-center">
            <img
              src="/Game_Show_Owl.webp"
              alt="Equity Feud Owl"
              className="owl-idle w-24 h-24 object-contain"
            />
          </div>
          <TeamScore
            name={config.team2Name}
            score={gameState.team2Score}
            active={gameState.activeTeam === 2}
          />
        </div>
      </div>
    </div>
  )
}

function TitleScreen({ config }: { config: { team1Name: string; team2Name: string } }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AepHeader />
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <img
          src="/Game_Show_Owl.webp"
          alt="Equity Feud Owl"
          className="owl-idle w-48 h-48 object-contain"
        />
        <h1 className="font-bungee text-8xl text-[var(--gold)] title-glow">EQUITY FEUD</h1>
        <div className="flex gap-16 text-3xl font-bungee">
          <span className="text-blue-400">{config.team1Name}</span>
          <span className="text-white opacity-40">VS</span>
          <span className="text-[var(--aep-red)]">{config.team2Name}</span>
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
          alt="Equity Feud Owl"
          className="owl-idle w-40 h-40 object-contain"
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
}: {
  name: string
  score: number
  active: boolean
}) {
  return (
    <div
      className={`text-center p-4 rounded-xl transition-all ${
        active ? 'bg-[var(--navy-light)] ring-2 ring-[var(--gold)] scale-105' : 'opacity-70'
      }`}
    >
      <p className="font-bungee text-xl mb-1 truncate max-w-[200px]">{name}</p>
      <p className="font-bungee text-5xl text-[var(--gold)]">{score}</p>
    </div>
  )
}
