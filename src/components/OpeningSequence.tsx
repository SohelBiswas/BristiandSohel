import { CSSProperties, useEffect, useRef, useState } from 'react'
import { invitation } from '../config'

const STORY_BEATS = [
  { text: 'Finally', tone: 'script' },
  { text: 'The wait is over', tone: 'serif' },
  { text: 'It’s happening', tone: 'serif' },
  { text: 'Because', tone: 'label' },
  { text: 'We are becoming one', tone: 'serif' },
  { text: 'Beginning our forever', tone: 'script final' },
] as const

type InterludePhase = 'idle' | 'opening' | 'playing' | 'finishing' | 'done'

const OPENING_END_PROGRESS = 0.84
const OPENING_DURATION_MS = 2400

function smoothStep(start: number, end: number, value: number) {
  const x = Math.min(1, Math.max(0, (value - start) / (end - start)))
  return x * x * (3 - 2 * x)
}

const INITIAL_OPENING_STYLE = {
  '--door-progress': 0,
  '--curtain-progress': 0,
  '--hero-progress': 0,
  '--door-left': '0%',
  '--door-right': '0%',
  '--door-left-rotate': '0deg',
  '--door-right-rotate': '0deg',
  '--curtain-left': '0%',
  '--curtain-right': '0%',
  '--hero-opacity': 0.58,
  '--hero-scale': 1.09,
  '--hero-saturation': 0.8,
  '--hero-y': '32px',
  '--gate-opacity': 1,
  '--seal-scale': 1,
} as CSSProperties

function paintOpening(
  sticky: HTMLDivElement,
  seal: HTMLButtonElement | null,
  progress: number,
  phase: InterludePhase,
) {
  const storyHasStarted = phase === 'playing' || phase === 'finishing' || phase === 'done'
  const heroIsVisible = phase === 'finishing' || phase === 'done'
  const door = storyHasStarted ? 1 : smoothStep(0.04, 0.46, progress)
  const curtain = storyHasStarted ? 1 : smoothStep(0.36, 0.84, progress)
  const hero = heroIsVisible ? 1 : 0
  const gate = smoothStep(0.05, 0.3, progress)
  const style = sticky.style

  style.setProperty('--door-progress', String(door))
  style.setProperty('--curtain-progress', String(curtain))
  style.setProperty('--hero-progress', String(hero))
  style.setProperty('--door-left', `${door * -104}%`)
  style.setProperty('--door-right', `${door * 104}%`)
  style.setProperty('--door-left-rotate', `${door * -10}deg`)
  style.setProperty('--door-right-rotate', `${door * 10}deg`)
  style.setProperty('--curtain-left', `${curtain * -105}%`)
  style.setProperty('--curtain-right', `${curtain * 105}%`)
  style.setProperty('--hero-opacity', String(0.58 + hero * 0.42))
  style.setProperty('--hero-scale', String(1.09 - hero * 0.09))
  style.setProperty('--hero-saturation', String(0.8 + hero * 0.2))
  style.setProperty('--hero-y', `${(1 - hero) * 32}px`)
  style.setProperty('--gate-opacity', String(1 - gate))
  style.setProperty('--seal-scale', String(1 - gate * 0.17))

  if (seal) {
    const hidden = gate > 0.92
    const currentlyHidden = seal.tabIndex === -1
    if (currentlyHidden !== hidden) {
      seal.tabIndex = hidden ? -1 : 0
      seal.setAttribute('aria-hidden', String(hidden))
      if (hidden && document.activeElement === seal) seal.blur()
    }
  }
}

export function OpeningSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const sealRef = useRef<HTMLButtonElement>(null)
  const progressRef = useRef(0)
  const phaseRef = useRef<InterludePhase>('idle')
  const animationFrameRef = useRef<number | null>(null)
  const hasLeftOpeningRef = useRef(false)
  const [interludePhase, setInterludePhase] = useState<InterludePhase>('idle')
  const [storyBeat, setStoryBeat] = useState(-1)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    phaseRef.current = interludePhase
    if (stickyRef.current) {
      paintOpening(stickyRef.current, sealRef.current, progressRef.current, interludePhase)
    }
  }, [interludePhase])

  useEffect(() => {
    if (interludePhase !== 'playing') return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timers: number[] = []

    if (reducedMotion) {
      setStoryBeat(STORY_BEATS.length - 1)
      timers.push(window.setTimeout(() => setInterludePhase('finishing'), 2400))
    } else {
      const starts = [400, 2400, 4400, 6400, 8400, 10400]
      starts.forEach((delay, index) => {
        timers.push(window.setTimeout(() => setStoryBeat(index), delay))
      })
      timers.push(window.setTimeout(() => setInterludePhase('finishing'), 12400))
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [interludePhase])

  useEffect(() => {
    if (interludePhase !== 'finishing') return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(
      () => setInterludePhase('done'),
      reducedMotion ? 180 : 760,
    )
    return () => window.clearTimeout(timer)
  }, [interludePhase])

  useEffect(() => {
    if (interludePhase === 'done') return

    const stopScroll = (event: Event) => event.preventDefault()
    const stopScrollKeys = (event: KeyboardEvent) => {
      const target = event.target
      const isActivationKey = event.key === ' ' || event.key === 'Enter'
      const isInteractiveTarget = target instanceof Element
        && Boolean(target.closest('button, a, input, select, textarea'))

      if (isActivationKey && isInteractiveTarget) return
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
        event.preventDefault()
      }
    }

    document.documentElement.classList.add('opening-locked')
    document.body.classList.add('opening-locked')
    window.addEventListener('wheel', stopScroll, { passive: false })
    window.addEventListener('touchmove', stopScroll, { passive: false })
    window.addEventListener('keydown', stopScrollKeys)
    return () => {
      document.documentElement.classList.remove('opening-locked')
      document.body.classList.remove('opening-locked')
      window.removeEventListener('wheel', stopScroll)
      window.removeEventListener('touchmove', stopScroll)
      window.removeEventListener('keydown', stopScrollKeys)
    }
  }, [interludePhase])

  useEffect(() => {
    if (interludePhase !== 'done') return

    const onScroll = () => {
      const section = sectionRef.current
      const sticky = stickyRef.current
      if (!section || !sticky) return

      const sectionTop = section.getBoundingClientRect().top + window.scrollY
      if (window.scrollY > sectionTop + sticky.offsetHeight * 0.55) {
        hasLeftOpeningRef.current = true
        return
      }

      if (hasLeftOpeningRef.current && window.scrollY <= sectionTop + 2) {
        hasLeftOpeningRef.current = false
        progressRef.current = 0
        phaseRef.current = 'idle'
        setStoryBeat(-1)
        paintOpening(sticky, sealRef.current, 0, 'idle')
        setInterludePhase('idle')
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [interludePhase])

  const heroIsVisible = interludePhase === 'finishing' || interludePhase === 'done'

  const advance = () => {
    const sticky = stickyRef.current
    if (!sticky || phaseRef.current !== 'idle') return

    phaseRef.current = 'opening'
    setInterludePhase('opening')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      progressRef.current = OPENING_END_PROGRESS
      paintOpening(sticky, sealRef.current, OPENING_END_PROGRESS, 'opening')
      phaseRef.current = 'playing'
      setInterludePhase('playing')
      return
    }

    const startedAt = performance.now()
    const animate = (now: number) => {
      if (phaseRef.current !== 'opening') {
        animationFrameRef.current = null
        return
      }

      const elapsed = Math.min(1, (now - startedAt) / OPENING_DURATION_MS)
      const progress = elapsed * OPENING_END_PROGRESS
      progressRef.current = progress
      paintOpening(sticky, sealRef.current, progress, 'opening')

      if (elapsed < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate)
        return
      }

      animationFrameRef.current = null
      phaseRef.current = 'playing'
      setInterludePhase('playing')
    }

    animationFrameRef.current = window.requestAnimationFrame(animate)
  }

  return (
    <section className="opening-sequence" ref={sectionRef} aria-label="Opening invitation">
      <div className="opening-sticky" ref={stickyRef} style={INITIAL_OPENING_STYLE}>
        <div className="opening-hero" aria-hidden={!heroIsVisible}>
          <div className="hero-background" />
          <div className="hero-vignette" />
          <div className="hero-copy">
            <div className="bismillah-block">
              <p lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
              <span>In the name of Allah, the Most Gracious, the Most Merciful</span>
            </div>
            <p className="hero-kicker">WE’RE GETTING ENGAGED</p>
            <h1>
              <span>{invitation.couple.first}</span>
              <b>&amp;</b>
              <span>{invitation.couple.second}</span>
            </h1>
            <div className="hero-rule" aria-hidden="true">
              <i />
              <span>✦</span>
              <i />
            </div>
          </div>
          <div className="hero-scroll-cue" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m5 9 7 7 7-7" /></svg>
          </div>
        </div>

        <div
          className={`opening-interlude ${interludePhase === 'playing' ? 'is-active' : ''} ${interludePhase === 'finishing' ? 'is-leaving' : ''}`}
          aria-hidden={interludePhase === 'idle' || interludePhase === 'opening' || interludePhase === 'done'}
          aria-live="polite"
        >
          <span className="interlude-corner interlude-corner-top" aria-hidden="true" />
          <span className="interlude-corner interlude-corner-bottom" aria-hidden="true" />
          {storyBeat >= 0 && (
            <p
              key={storyBeat}
              className={`interlude-beat interlude-beat-${STORY_BEATS[storyBeat].tone.replace(' ', '-')}`}
            >
              {STORY_BEATS[storyBeat].text}
            </p>
          )}
          <span className="interlude-filigree" aria-hidden="true">❦</span>
          <span className="interlude-progress" aria-hidden="true">
            {STORY_BEATS.map((beat, index) => (
              <i key={beat.text} className={index <= storyBeat ? 'is-lit' : ''} />
            ))}
          </span>
        </div>

        <div className="curtain curtain-left" aria-hidden="true"><span /></div>
        <div className="curtain curtain-right" aria-hidden="true"><span /></div>

        <div className="door door-left" aria-hidden="true"><div className="door-art" /></div>
        <div className="door door-right" aria-hidden="true"><div className="door-art" /></div>

        <button
          className="invitation-seal"
          ref={sealRef}
          type="button"
          onClick={advance}
          aria-label="Open the invitation"
          aria-hidden="false"
          tabIndex={0}
        >
          <span className="seal-monogram">
            <svg className="seal-plaque-art" viewBox="0 0 180 206" aria-hidden="true">
              <path className="seal-plaque-outer" d="M90 4C102 19 116 27 134 30C151 33 165 48 162 67C160 82 168 93 176 103C167 114 160 125 162 140C165 159 151 174 134 177C116 180 102 188 90 202C78 188 64 180 46 177C29 174 15 159 18 140C20 125 13 114 4 103C13 92 20 81 18 66C15 48 29 33 46 30C64 27 78 19 90 4Z" />
              <path className="seal-plaque-inner" transform="translate(12 13) scale(.866)" d="M90 4C102 19 116 27 134 30C151 33 165 48 162 67C160 82 168 93 176 103C167 114 160 125 162 140C165 159 151 174 134 177C116 180 102 188 90 202C78 188 64 180 46 177C29 174 15 159 18 140C20 125 13 114 4 103C13 92 20 81 18 66C15 48 29 33 46 30C64 27 78 19 90 4Z" />
            </svg>
            <svg className="seal-wreath" viewBox="0 0 160 160" aria-hidden="true">
              <path d="M35 105c-13-19-13-43 0-61M125 105c13-19 13-43 0-61" />
              <path d="M34 92c-10-1-16-6-19-14 10-2 17 2 22 10M35 75c-9-4-13-10-13-19 10 1 16 6 18 15M39 57c-7-6-9-13-6-21 9 4 13 10 12 19M126 92c10-1 16-6 19-14-10-2-17 2-22 10M125 75c9-4 13-10 13-19-10 1-16 6-18 15M121 57c7-6 9-13 6-21-9 4-13 10-12 19" />
            </svg>
            <span className="seal-letters"><i>S</i><b>&amp;</b><i>B</i></span>
          </span>
          <span className="seal-action">TAP TO OPEN</span>
          <svg className="seal-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7" /></svg>
        </button>
      </div>
    </section>
  )
}
