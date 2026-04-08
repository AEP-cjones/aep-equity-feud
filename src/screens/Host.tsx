import { useState, useEffect } from 'react'
import {
  useGameState,
  useConfig,
  useRounds,
  updateGameState,
  updateConfig,
  revealAnswer,
  resetRoundAnswers,
} from '../hooks/useFirebase'
import AepHeader from '../components/AepHeader'
import type { GameState, Round } from '../types'

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
      <div className="p-4 max-w-3xl mx-auto w-full space-y-4">
        <h1 className="font-bungee text-2xl text-[var(--gold)] text-center">Host Control Panel</h1>

        {/* Game Status */}
        <StatusBar gameState={gameState} config={config} />

        {/* Team Names */}
        <TeamNameEditor config={config} />

        {/* Round Selector */}
        <div className="bg-[var(--navy-light)] rounded-xl p-4">
          <h3 className="font-bungee text-lg mb-3">Round Select</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {roundKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleSelectRound(key, rounds[key], gameState)}
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
        </div>

        {/* Current Round Answers */}
        {currentRound && (
          <div className="bg-[var(--navy-light)] rounded-xl p-4">
            <h3 className="font-bungee text-lg mb-1 text-[var(--gold)]">
              {currentRound.question}
            </h3>
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
          </div>
        )}

        {/* Game Controls */}
        <div className="bg-[var(--navy-light)] rounded-xl p-4 space-y-3">
          <h3 className="font-bungee text-lg">Controls</h3>

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
        </div>
      </div>
    </div>
  )
}

async function handleSelectRound(roundId: string, round: Round, gameState: GameState) {
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

function StatusBar({
  gameState,
  config,
}: {
  gameState: GameState
  config: { team1Name: string; team2Name: string }
}) {
  return (
    <div className="bg-[var(--navy-light)] rounded-xl p-3 flex items-center justify-between text-sm">
      <span>
        Status: <strong className="text-[var(--gold)]">{gameState.status.toUpperCase()}</strong>
      </span>
      <span>
        Round: <strong>{gameState.currentRound || '—'}</strong>
      </span>
      <span>
        Active: <strong>{gameState.activeTeam === 1 ? config.team1Name : config.team2Name}</strong>
      </span>
      <span>
        Strikes: <strong className="text-[var(--strike-red)]">{gameState.strikes}</strong>
      </span>
    </div>
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
    <div className="bg-[var(--navy-light)] rounded-xl p-4 flex gap-3">
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
    </div>
  )
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
