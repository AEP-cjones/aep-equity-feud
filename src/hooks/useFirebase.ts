import { useEffect, useState } from 'react'
import { dbRef, onValue, set, update, get, remove } from '../firebase'
import type { GameState, GameConfig, Rounds, Round } from '../types'

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    const unsub = onValue(dbRef('gameState'), (snap) => {
      setGameState(snap.val())
    })
    return unsub
  }, [])

  return gameState
}

export function useConfig() {
  const [config, setConfig] = useState<GameConfig | null>(null)

  useEffect(() => {
    const unsub = onValue(dbRef('config'), (snap) => {
      setConfig(snap.val())
    })
    return unsub
  }, [])

  return config
}

export function useRounds() {
  const [rounds, setRounds] = useState<Rounds | null>(null)

  useEffect(() => {
    const unsub = onValue(dbRef('rounds'), (snap) => {
      setRounds(snap.val())
    })
    return unsub
  }, [])

  return rounds
}

export async function initializeGame(defaults: { gameState: GameState; config: GameConfig }) {
  const snap = await get(dbRef('gameState'))
  if (!snap.exists()) {
    await set(dbRef('gameState'), defaults.gameState)
  }
  const configSnap = await get(dbRef('config'))
  if (!configSnap.exists()) {
    await set(dbRef('config'), defaults.config)
  }
}

export async function updateGameState(updates: Partial<GameState>) {
  await update(dbRef('gameState'), updates)
}

export async function updateConfig(updates: Partial<GameConfig>) {
  await update(dbRef('config'), updates)
}

export async function revealAnswer(roundId: string, answerIndex: number) {
  await set(dbRef(`rounds/${roundId}/answers/${answerIndex}/revealed`), true)
}

export async function hideAnswer(roundId: string, answerIndex: number) {
  await set(dbRef(`rounds/${roundId}/answers/${answerIndex}/revealed`), false)
}

export async function resetRoundAnswers(roundId: string, answers: Round['answers']) {
  const resetAnswers = answers.map((a) => ({ ...a, revealed: false }))
  await set(dbRef(`rounds/${roundId}/answers`), resetAnswers)
}

export async function saveRound(roundId: string, round: Round) {
  await set(dbRef(`rounds/${roundId}`), round)
}

export async function deleteRound(roundId: string) {
  await remove(dbRef(`rounds/${roundId}`))
}

export async function createRound(round: Round): Promise<string> {
  const roundsSnap = await get(dbRef('rounds'))
  const existing = roundsSnap.val() || {}
  const count = Object.keys(existing).length
  const id = `round${count + 1}`
  await set(dbRef(`rounds/${id}`), round)
  return id
}
