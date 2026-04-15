export interface Answer {
  text: string
  points: number
  revealed: boolean
}

export interface Round {
  question: string
  answers: Answer[]
}

export interface Rounds {
  [key: string]: Round
}

export interface GameConfig {
  adminPassword: string
  team1Name: string
  team2Name: string
}

export interface GameState {
  status: 'title' | 'playing' | 'steal' | 'final'
  currentRound: string
  strikes: number
  team1Score: number
  team2Score: number
  roundPoints: number
  activeTeam: 1 | 2
}

export const DEFAULT_CONFIG: GameConfig = {
  adminPassword: 'aep2026',
  team1Name: 'Team 1',
  team2Name: 'Team 2',
}

export const DEFAULT_GAME_STATE: GameState = {
  status: 'title',
  currentRound: '',
  strikes: 0,
  team1Score: 0,
  team2Score: 0,
  roundPoints: 0,
  activeTeam: 1,
}

// ─── Audience (QR-code mobile players) ────────────────────────────────
export interface AudiencePlayer {
  team: 1 | 2
  joinedAt: string
}

export interface AudienceAnswer {
  text: string
  team: 1 | 2
  submittedAt: string
}

export interface Lead {
  firstName: string
  lastName: string
  email: string
  company?: string
  phone?: string
  team?: 1 | 2
  submittedAt: string
}

export interface AudiencePlayers {
  [playerId: string]: AudiencePlayer
}

export interface AudienceAnswersByRound {
  [roundId: string]: {
    [playerId: string]: AudienceAnswer
  }
}

export interface Leads {
  [playerId: string]: Lead
}
