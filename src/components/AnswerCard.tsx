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
  const textSize = large ? 'text-3xl' : 'text-2xl'
  const pointSize = large ? 'text-2xl' : 'text-xl'

  return (
    <div className={`flip-card w-full ${height} ${justRevealed ? 'reveal-glow' : ''}`}>
      <div className={`flip-card-inner ${answer.revealed ? 'revealed' : ''}`}>
        <div className="flip-card-front">
          <span className={`font-bungee ${large ? 'text-5xl' : 'text-4xl'} text-[#3a6a9f]`}>
            {index + 1}
          </span>
        </div>
        <div className="flip-card-back px-4 flex justify-between">
          <span className={`font-bungee ${textSize} truncate flex-1 text-left`}>
            {answer.text}
          </span>
          <span className={`font-bungee ${pointSize} ml-4 text-[var(--navy)]`}>
            {answer.points}
          </span>
        </div>
      </div>
    </div>
  )
}
