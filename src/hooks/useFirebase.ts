import { useEffect, useState } from 'react'
import { dbRef, onValue, set, update, get, remove } from '../firebase'
import type {
  GameState, GameConfig, Rounds, Round,
  AudiencePlayers, AudienceAnswersByRound, AudiencePlayer,
  AudienceAnswer, Lead, Leads,
} from '../types'

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

// ─── Audience (QR-code mobile players) ────────────────────────────────

export function useAudiencePlayers() {
  const [players, setPlayers] = useState<AudiencePlayers | null>(null)
  useEffect(() => {
    const unsub = onValue(dbRef('players'), (snap) => setPlayers(snap.val()))
    return unsub
  }, [])
  return players
}

export function useAudiencePlayer(playerId: string | null) {
  const [player, setPlayer] = useState<AudiencePlayer | null>(null)
  useEffect(() => {
    if (!playerId) {
      setPlayer(null)
      return
    }
    const unsub = onValue(dbRef(`players/${playerId}`), (snap) => setPlayer(snap.val()))
    return unsub
  }, [playerId])
  return player
}

export function useAudienceAnswersForRound(roundId: string | null | undefined) {
  const [answers, setAnswers] = useState<Record<string, AudienceAnswer> | null>(null)
  useEffect(() => {
    if (!roundId) {
      setAnswers(null)
      return
    }
    const unsub = onValue(dbRef(`audienceAnswers/${roundId}`), (snap) => setAnswers(snap.val()))
    return unsub
  }, [roundId])
  return answers
}

export function useAllAudienceAnswers() {
  const [all, setAll] = useState<AudienceAnswersByRound | null>(null)
  useEffect(() => {
    const unsub = onValue(dbRef('audienceAnswers'), (snap) => setAll(snap.val()))
    return unsub
  }, [])
  return all
}

export function useLeads() {
  const [leads, setLeads] = useState<Leads | null>(null)
  useEffect(() => {
    const unsub = onValue(dbRef('leads'), (snap) => setLeads(snap.val()))
    return unsub
  }, [])
  return leads
}

export async function joinAudience(playerId: string, team: 1 | 2) {
  await set(dbRef(`players/${playerId}`), {
    team,
    joinedAt: new Date().toISOString(),
  } satisfies AudiencePlayer)
}

export async function submitAudienceAnswer(
  playerId: string,
  roundId: string,
  team: 1 | 2,
  text: string,
) {
  await set(dbRef(`audienceAnswers/${roundId}/${playerId}`), {
    text: text.trim(),
    team,
    submittedAt: new Date().toISOString(),
  } satisfies AudienceAnswer)
}

export async function submitLead(playerId: string, lead: Omit<Lead, 'submittedAt'>) {
  await set(dbRef(`leads/${playerId}`), {
    ...lead,
    submittedAt: new Date().toISOString(),
  } satisfies Lead)
}

/** Write Zoho sync markers back to the lead record after a successful sync. */
export async function markLeadSynced(playerId: string, zohoLeadId: string) {
  await update(dbRef(`leads/${playerId}`), {
    zohoLeadId,
    zohoSyncedAt: new Date().toISOString(),
  })
}

export async function resetAudience() {
  await remove(dbRef('players'))
  await remove(dbRef('audienceAnswers'))
  await remove(dbRef('leads'))
}
