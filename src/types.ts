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
