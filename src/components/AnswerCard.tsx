import { useEffect, useState } from 'react'
import type { Answer } from '../types'

interface Props {
  answer: Answer
  index: number
  large?: boolean
}

export default function AnswerCard({ answer, index, large }: Props) {
  const [justRevealed, setJustRevealed] = useState(false)
  const [wasRevealed, setWasRevealed] = useState(answer.revealed)

  useEffect(() => {
    if (answer.revealed && !wasRevealed) {
      setJustRevealed(true)
      const timer = setTimeout(() => setJustRevealed(false), 800)
      setWasRevealed(true)
      return () => clearTimeout(timer)
    }
    setWasRevealed(answer.revealed)
  }, [answer.revealed])

  const height = large ? 'h-20' : 'h-16'
  const textSize = large ? 'text-2xl' : 'text-xl'

  return (
    <div className={`flip-card w-full ${height} ${justRevealed ? 'reveal-glow' : ''}`}>
      <div className={`flip-card-inner ${answer.revealed ? 'revealed' : ''}`}>
        <div className="flip-card-front">
          <span className={`font-bungee ${large ? 'text-5xl' : 'text-4xl'} text-[#3a6a9f]`}>
            {index + 1}
          </span>
        </div>
        {/* Revealed face: centered answer text + small points badge on the right */}
        <div className="flip-card-back relative px-12 flex items-center justify-center">
          <span className={`font-bungee ${textSize} text-center truncate text-[var(--navy)]`}>
            {answer.text}
          </span>
          <span
            className="absolute font-bungee text-2xl text-white"
            style={{
              right: '0.6rem',
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: '3.25rem',
              padding: '0.35rem 0.5rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(180deg, #1f4a7a, #143759)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15), 0 1px 0 rgba(0,0,0,0.4)',
              textAlign: 'center',
            }}
          >
            {answer.points}
          </span>
        </div>
      </div>
    </div>
  )
}
