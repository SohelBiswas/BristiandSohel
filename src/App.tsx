import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { OpeningSequence } from './components/OpeningSequence'
import { Reveal } from './components/Reveal'
import { ScratchCard } from './components/ScratchCard'
import { invitation } from './config'
import { useSoundtrack } from './hooks/useSoundtrack'

type IconProps = { className?: string }

function VolumeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v4h3.5l4.5 4V6l-4.5 4H4Z" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a7.6 7.6 0 0 1 0 11" />
    </svg>
  )
}

function VolumeOffIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v4h3.5l4.5 4V6l-4.5 4H4Z" />
      <path d="m16 10 5 5m0-5-5 5" />
    </svg>
  )
}

function MapPinIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
}

function CalendarIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" /><path d="M8 2v4m8-4v4M3 9h18" /><path d="m9 14 2 2 4-4" /></svg>
}

function GiftIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v11H4zM2 6h20v4H2zM12 6v15" /><path d="M12 6H8.5A2.5 2.5 0 1 1 11 3.5L12 6Zm0 0h3.5A2.5 2.5 0 1 0 13 3.5L12 6Z" /></svg>
}

function Ornament() {
  return <div className="ornament" aria-hidden="true"><i /><span>✦</span><i /></div>
}

function FlowerShower({ active }: { active: boolean }) {
  if (!active) return null

  const blossoms = ['✿', '❀', '✦']
  return (
    <div className="flower-shower" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => (
        <i
          key={index}
          style={{
            '--flower-left': `${2 + ((index * 17) % 96)}%`,
            '--flower-size': `${13 + (index % 5) * 4}px`,
            '--flower-delay': `${(index % 8) * 0.12}s`,
            '--flower-duration': `${3.2 + (index % 6) * 0.24}s`,
            '--flower-drift': `${-52 + (index % 7) * 18}px`,
            '--flower-turn': `${240 + (index % 5) * 85}deg`,
            '--flower-color': ['#d7a89b', '#e6c9a7', '#cba65a', '#f1ded2'][index % 4],
          } as CSSProperties}
        >
          {blossoms[index % blossoms.length]}
        </i>
      ))}
    </div>
  )
}

function smoothProgress(start: number, end: number, value: number) {
  const x = Math.min(1, Math.max(0, (value - start) / (end - start)))
  return x * x * (3 - 2 * x)
}

function WelcomeSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const range = Math.max(1, section.offsetHeight - window.innerHeight)
      setProgress(Math.min(1, Math.max(0, -rect.top / range)))
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const title = smoothProgress(0.02, 0.3, progress)
  const ornament = smoothProgress(0.18, 0.44, progress)
  const copy = smoothProgress(0.32, 0.68, progress)
  const names = smoothProgress(0.5, 0.84, progress)
  const ending = smoothProgress(0.68, 0.96, progress)
  const style = {
    '--welcome-title-opacity': title,
    '--welcome-title-y': `${(1 - title) * 36}px`,
    '--welcome-ornament-scale': ornament,
    '--welcome-copy-opacity': copy,
    '--welcome-copy-y': `${(1 - copy) * 30}px`,
    '--welcome-names-opacity': names,
    '--welcome-names-scale': 0.9 + names * 0.1,
    '--welcome-ending-opacity': ending,
    '--welcome-ending-y': `${(1 - ending) * 18}px`,
    '--welcome-petal-shift': `${progress * 42}px`,
  } as CSSProperties

  return (
    <section className="paper-section welcome-section" ref={sectionRef} style={style}>
      <div className="welcome-sticky">
        <PetalField />
        <div className="welcome-scroll-copy">
          <p className="section-script">With joyful hearts</p>
          <Ornament />
          <p className="welcome-copy">
            <span className="welcome-invite">We invite you</span>
            <span className="welcome-line">to celebrate the engagement of</span>
            <strong>{invitation.couple.first} <em>&amp;</em> {invitation.couple.second}</strong>
            <span className="welcome-ending">as two stories become one beautiful beginning.</span>
          </p>
        </div>
      </div>
    </section>
  )
}

function PetalField({ active = true }: { active?: boolean }) {
  if (!active) return null
  return (
    <div className="petal-field" aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => (
        <i
          key={index}
          style={{
            '--petal-left': `${4 + index * 7}%`,
            '--petal-width': `${7 + (index % 4) * 2}px`,
            '--petal-height': `${11 + (index % 3) * 3}px`,
            '--petal-delay': `${index * -1.3}s`,
            '--petal-duration': `${10 + (index % 5) * 1.2}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

function useCountdown() {
  const target = useMemo(() => new Date(invitation.event.dateTime).getTime(), [])
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()))

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000)
    return () => window.clearInterval(timer)
  }, [target])

  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  }
}

function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? window.scrollY / total : 0)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])
  return <div className="scroll-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
}

function Countdown() {
  const countdown = useCountdown()
  const items = [
    ['DAYS', countdown.days],
    ['HOURS', countdown.hours],
    ['MINUTES', countdown.minutes],
    ['SECONDS', countdown.seconds],
  ] as const
  return (
    <div className="countdown" aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes and ${countdown.seconds} seconds until the engagement`}>
      {items.map(([label, value]) => (
        <div key={label}>
          <strong>{String(value).padStart(2, '0')}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

function saveDate() {
  const toIcsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sohel and Bristi//Engagement//EN',
    'BEGIN:VEVENT',
    `UID:sohel-bristi-engagement-20261018@invitation`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(invitation.event.dateTime)}`,
    `DTEND:${toIcsDate(invitation.event.endDateTime)}`,
    `SUMMARY:${invitation.event.title}`,
    `LOCATION:${invitation.venue.name}`,
    'DESCRIPTION:Celebrate the engagement of Sohel and Bristi.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'sohel-bristi-engagement.ics'
  anchor.click()
  URL.revokeObjectURL(url)
}

function SaveDatePicker() {
  const [open, setOpen] = useState(false)
  const formatGoogleDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const googleUrl = new URL('https://calendar.google.com/calendar/render')
  googleUrl.searchParams.set('action', 'TEMPLATE')
  googleUrl.searchParams.set('text', invitation.event.title)
  googleUrl.searchParams.set('dates', `${formatGoogleDate(invitation.event.dateTime)}/${formatGoogleDate(invitation.event.endDateTime)}`)
  googleUrl.searchParams.set('details', 'Celebrate the engagement of Sohel and Bristi.')
  googleUrl.searchParams.set('location', invitation.venue.name)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <button className="primary-button save-button" type="button" onClick={() => setOpen(true)}>
        <CalendarIcon />
        <span>SAVE THE DATE</span>
      </button>
      {open && createPortal(
        <div className="calendar-sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="calendar-sheet" role="dialog" aria-modal="true" aria-labelledby="calendar-title" onClick={(event) => event.stopPropagation()}>
            <div className="calendar-sheet-handle" aria-hidden="true" />
            <p className="section-label">18 OCTOBER 2026</p>
            <h3 id="calendar-title">Save our date</h3>
            <a href={googleUrl.toString()} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
              <CalendarIcon />
              <span><strong>Google Calendar</strong><small>Open and save online</small></span>
            </a>
            <button type="button" onClick={() => { saveDate(); setOpen(false) }}>
              <CalendarIcon />
              <span><strong>Apple, Outlook or other</strong><small>Download a calendar file</small></span>
            </button>
            <button className="calendar-close" type="button" onClick={() => setOpen(false)}>CLOSE</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function getPublicInvitationUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_URL?.trim()
  if (configuredUrl) return configuredUrl

  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) return null

  const publicUrl = new URL(window.location.href)
  publicUrl.hash = ''
  publicUrl.search = ''
  return publicUrl.toString()
}

export default function App() {
  const [dateRevealed, setDateRevealed] = useState(false)
  const [flowersActive, setFlowersActive] = useState(false)
  const [shareStatus, setShareStatus] = useState('Share invitation')
  const soundtrack = useSoundtrack()

  useEffect(() => {
    if (!flowersActive) return
    const timer = window.setTimeout(() => setFlowersActive(false), 5200)
    return () => window.clearTimeout(timer)
  }, [flowersActive])

  const revealDate = () => {
    setDateRevealed(true)
    setFlowersActive(true)
  }

  const shareInvitation = async () => {
    const publicUrl = getPublicInvitationUrl()
    if (!publicUrl) {
      setShareStatus('Available after publishing')
      window.setTimeout(() => setShareStatus('Share invitation'), 2600)
      return
    }

    const shareData = {
      title: invitation.event.title,
      text: `Join us for the engagement of ${invitation.couple.first} and ${invitation.couple.second} on ${invitation.event.dateLabel}.`,
      url: publicUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(publicUrl)
        setShareStatus('Link copied')
        window.setTimeout(() => setShareStatus('Share invitation'), 2200)
      }
    } catch {
      // The native share sheet can be dismissed without changing the page.
    }
  }

  return (
    <div className="site-shell">
      <ScrollProgress />
      <FlowerShower active={flowersActive} />
      <button
        className={`music-toggle ${soundtrack.audible ? 'is-playing' : ''}`}
        type="button"
        onClick={soundtrack.toggle}
        aria-pressed={soundtrack.playing}
        aria-label={soundtrack.playing ? 'Pause Jashn-E-Bahaaraa' : 'Play Jashn-E-Bahaaraa'}
        data-soundtrack-status={soundtrack.status}
      >
        {soundtrack.playing ? <VolumeIcon /> : <VolumeOffIcon />}
      </button>

      <main className="invitation-page">
        <OpeningSequence />

        <WelcomeSequence />

        <section className="paper-section scratch-section">
          <Reveal>
            <p className="section-label">A DATE TO REMEMBER</p>
            <h2>{dateRevealed ? 'Our forever begins' : 'Scratch to Reveal'}</h2>
            <p className="section-intro">{dateRevealed ? 'Keep this day close to your heart.' : 'A little surprise is waiting beneath the sage.'}</p>
          </Reveal>
          <Reveal delay={120}>
            <ScratchCard onReveal={revealDate} />
          </Reveal>
          {dateRevealed && <Reveal delay={180}><SaveDatePicker /></Reveal>}
        </section>

        <section className="paper-section countdown-section">
          <Reveal>
            <p className="section-script">Counting down to forever</p>
            <Ornament />
          </Reveal>
          <Reveal delay={100}><Countdown /></Reveal>
          <Reveal delay={180} className="event-line">
            <span>Sunday</span>
            <strong>18 October 2026</strong>
            <span>Celebration begins at 12:00 PM</span>
          </Reveal>
        </section>

        <section className="venue-section">
          <div className="venue-image-wrap">
            <img src={`${import.meta.env.BASE_URL}assets/venue-hall.jpg`} alt="An elegant, warmly lit marriage hall entrance" />
            <div className="venue-image-fade" />
          </div>
          <div className="venue-copy paper-section">
            <Reveal>
              <p className="section-label">THE CELEBRATION</p>
              <h2>{invitation.venue.name}</h2>
              <Ornament />
              <p>{invitation.event.dateLabel}<br />{invitation.event.timeLabel}</p>
              <a className="primary-button" href={invitation.venue.mapsUrl} target="_blank" rel="noreferrer">
                <MapPinIcon />
                <span>OPEN IN MAPS</span>
              </a>
            </Reveal>
          </div>
        </section>

        <section className="paper-section details-section">
          <Reveal>
            <p className="section-script">A few little notes</p>
            <Ornament />
          </Reveal>
          <div className="detail-list">
            <Reveal className="detail-row">
              <div className="detail-icon"><MapPinIcon /></div>
              <div><span>VENUE</span><strong>{invitation.venue.name}</strong></div>
            </Reveal>
            <Reveal className="detail-row" delay={80}>
              <div className="detail-icon"><CalendarIcon /></div>
              <div><span>TIMING</span><strong>Please arrive by 12:00 PM</strong></div>
            </Reveal>
            <Reveal className="detail-row" delay={140}>
              <div className="detail-icon"><GiftIcon /></div>
              <div><span>GIFTS</span><strong>Your presence is our greatest gift.</strong></div>
            </Reveal>
          </div>
        </section>

        <section className="closing-section">
          <PetalField />
          <div className="closing-copy">
            <Reveal>
              <p>We can’t wait to celebrate with you</p>
              <h2><span>Bristi</span><b>&amp;</b><span>Sohel</span></h2>
              <Ornament />
              <time dateTime="2026-10-18">18 · 10 · 2026</time>
              <div className="closing-actions">
                <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Replay invitation</button>
                <button type="button" onClick={shareInvitation}>{shareStatus}</button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </div>
  )
}
