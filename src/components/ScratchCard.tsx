import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react'

type ScratchCardProps = {
  onReveal?: () => void
}

function makeHeartPath(width: number, height: number) {
  const sx = width / 100
  const sy = height / 92
  const path = new Path2D()
  path.moveTo(50 * sx, 90 * sy)
  path.bezierCurveTo(45 * sx, 82 * sy, 8 * sx, 61 * sy, 8 * sx, 31 * sy)
  path.bezierCurveTo(8 * sx, 12 * sy, 29 * sx, 4 * sy, 50 * sx, 24 * sy)
  path.bezierCurveTo(71 * sx, 4 * sy, 92 * sx, 12 * sy, 92 * sx, 31 * sy)
  path.bezierCurveTo(92 * sx, 61 * sy, 55 * sx, 82 * sy, 50 * sx, 90 * sy)
  path.closePath()
  return path
}

export function ScratchCard({ onReveal }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const movesRef = useRef(0)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [revealed, setRevealed] = useState(false)

  const finishReveal = useCallback(() => {
    if (revealed) return
    window.getSelection()?.removeAllRanges()
    setRevealed(true)
    onReveal?.()
  }, [onReveal, revealed])

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current
    const card = cardRef.current
    if (!canvas || !card || revealed) return
    const rect = card.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(rect.width * ratio)
    canvas.height = Math.round(rect.height * ratio)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    const heart = makeHeartPath(rect.width, rect.height)
    context.save()
    context.clip(heart)
    const gradient = context.createLinearGradient(0, 0, rect.width, rect.height)
    gradient.addColorStop(0, '#6f8064')
    gradient.addColorStop(0.45, '#4a5c3d')
    gradient.addColorStop(1, '#2f4028')
    context.fillStyle = gradient
    context.fillRect(0, 0, rect.width, rect.height)

    context.strokeStyle = 'rgba(232, 210, 155, .44)'
    context.lineWidth = 1
    for (let x = -rect.height; x < rect.width; x += 26) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x + rect.height, rect.height)
      context.stroke()
    }

    context.fillStyle = '#f6edda'
    context.textAlign = 'center'
    context.font = `500 ${Math.max(15, rect.width * 0.045)}px Playfair Display, serif`
    context.letterSpacing = '4px'
    context.fillText('SCRATCH TO REVEAL', rect.width / 2, rect.height * 0.49)

    context.fillStyle = '#cfad64'
    const sparkles = [
      [0.17, 0.22], [0.82, 0.2], [0.12, 0.76], [0.84, 0.72], [0.5, 0.17],
    ]
    sparkles.forEach(([x, y], index) => {
      const size = index === 4 ? 5 : 3
      context.beginPath()
      context.moveTo(rect.width * x, rect.height * y - size)
      context.lineTo(rect.width * x + size, rect.height * y)
      context.lineTo(rect.width * x, rect.height * y + size)
      context.lineTo(rect.width * x - size, rect.height * y)
      context.closePath()
      context.fill()
    })
    context.restore()
  }, [revealed])

  useEffect(() => {
    paintCover()
    window.addEventListener('resize', paintCover)
    return () => window.removeEventListener('resize', paintCover)
  }, [paintCover])

  const erase = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || revealed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const context = canvas.getContext('2d')
    if (!context) return
    const radius = Math.max(22, rect.width * 0.075)
    context.save()
    context.globalCompositeOperation = 'destination-out'
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = radius * 2
    context.beginPath()
    const previous = lastPointRef.current
    if (previous) {
      context.moveTo(previous.x, previous.y)
      context.lineTo(x, y)
      context.stroke()
    } else {
      context.arc(x, y, radius, 0, Math.PI * 2)
      context.fill()
    }
    context.restore()
    lastPointRef.current = { x, y }
    movesRef.current += 1
  }

  const checkProgress = () => {
    const canvas = canvasRef.current
    if (!canvas || revealed) return
    const context = canvas.getContext('2d')
    if (!context) return
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let transparent = 0
    let sampled = 0
    const sampleStep = Math.max(12, Math.round(canvas.width / 48))
    const heart = makeHeartPath(canvas.width, canvas.height)
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    for (let y = 0; y < canvas.height; y += sampleStep) {
      for (let x = 0; x < canvas.width; x += sampleStep) {
        if (!context.isPointInPath(heart, x, y)) continue
        sampled += 1
        const alphaIndex = (Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3
        if (pixels[alphaIndex] < 48) transparent += 1
      }
    }
    context.restore()
    if ((sampled > 0 && transparent / sampled > 0.36) || movesRef.current > 58) finishReveal()
  }

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    drawingRef.current = true
    lastPointRef.current = null
    event.currentTarget.setPointerCapture(event.pointerId)
    erase(event)
  }

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false
    lastPointRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    checkProgress()
  }

  return (
    <div className={`scratch-stage ${revealed ? 'is-revealed' : ''}`}>
      <div className="scratch-card" ref={cardRef}>
        <div className="scratch-content" aria-live="polite">
          <p>You’re invited</p>
          <strong>18</strong>
          <span>OCTOBER</span>
          <em>2026</em>
          <small>Sunday</small>
        </div>
        {!revealed && (
          <canvas
            ref={canvasRef}
            className="scratch-cover"
            role="button"
            tabIndex={0}
            aria-label="Scratch or press Enter to reveal the engagement date"
            onPointerDown={onPointerDown}
            onPointerMove={erase}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                finishReveal()
              }
            }}
          />
        )}
      </div>
      <svg className="scratch-frame" viewBox="0 0 100 92" aria-hidden="true">
        <path className="scratch-frame-outer" d="M50 90C45 82 8 61 8 31C8 12 29 4 50 24C71 4 92 12 92 31C92 61 55 82 50 90Z" />
        <path className="scratch-frame-inner" transform="translate(50 46) scale(.91) translate(-50 -46)" d="M50 90C45 82 8 61 8 31C8 12 29 4 50 24C71 4 92 12 92 31C92 61 55 82 50 90Z" />
      </svg>
    </div>
  )
}
