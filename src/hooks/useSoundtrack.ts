import { useCallback, useEffect, useRef, useState } from 'react'

const SOUNDTRACK_URL = `${import.meta.env.BASE_URL}assets/jashn-e-bahaaraa.m4a`
const SOUNDTRACK_VOLUME = 0.58

export type SoundtrackStatus =
  | 'starting'
  | 'playing-audible'
  | 'blocked'
  | 'paused'
  | 'error'

declare global {
  interface Window {
    engagementSoundtrackAudio?: HTMLAudioElement
  }
}

export function useSoundtrack() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const wantsPlaybackRef = useRef(true)
  const manuallyPausedRef = useRef(false)
  const playAttemptRef = useRef(0)
  const statusRef = useRef<SoundtrackStatus>('starting')
  const [status, setStatus] = useState<SoundtrackStatus>('starting')

  const updateStatus = useCallback((nextStatus: SoundtrackStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])

  const requestPlayback = useCallback(() => {
    wantsPlaybackRef.current = true
    manuallyPausedRef.current = false
    const audio = audioRef.current
    if (!audio) return

    const attempt = ++playAttemptRef.current
    audio.muted = false
    audio.volume = SOUNDTRACK_VOLUME
    if (audio.ended) audio.currentTime = 0
    updateStatus('starting')

    // Call play directly in the tap handler, even while the audio is loading.
    // Waiting for canplay would lose the browser's user-activation permission.
    void audio.play().then(() => {
      if (
        audio !== audioRef.current
        || attempt !== playAttemptRef.current
        || manuallyPausedRef.current
        || !wantsPlaybackRef.current
      ) return
      if (!audio.paused && !audio.muted) updateStatus('playing-audible')
    }).catch((error: unknown) => {
      // A rejected load-time autoplay attempt must not override a later tap.
      if (
        audio !== audioRef.current
        || attempt !== playAttemptRef.current
        || manuallyPausedRef.current
        || !wantsPlaybackRef.current
      ) return
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError') updateStatus('blocked')
      else if (name !== 'AbortError') updateStatus('error')
    })
  }, [updateStatus])

  const pause = useCallback(() => {
    ++playAttemptRef.current
    wantsPlaybackRef.current = false
    manuallyPausedRef.current = true
    audioRef.current?.pause()
    updateStatus('paused')
  }, [updateStatus])

  const toggle = useCallback(() => {
    if (statusRef.current === 'playing-audible') pause()
    else requestPlayback()
  }, [pause, requestPlayback])

  useEffect(() => {
    // One audio element also prevents overlapping sound after a dev reload.
    const staleAudio = window.engagementSoundtrackAudio
    if (staleAudio) {
      staleAudio.pause()
      staleAudio.removeAttribute('src')
      staleAudio.load()
      staleAudio.remove()
    }

    const audio = document.createElement('audio')
    audio.id = 'background-soundtrack'
    audio.preload = 'auto'
    audio.loop = false
    audio.autoplay = true
    audio.muted = false
    audio.volume = SOUNDTRACK_VOLUME
    audio.hidden = true
    audio.setAttribute('playsinline', '')
    audio.setAttribute('aria-hidden', 'true')
    audio.src = SOUNDTRACK_URL
    audioRef.current = audio
    window.engagementSoundtrackAudio = audio
    document.body.append(audio)

    const onPlaying = () => {
      if (audio !== audioRef.current) return
      if (manuallyPausedRef.current || !wantsPlaybackRef.current) {
        audio.pause()
        return
      }
      if (!audio.paused && !audio.muted) updateStatus('playing-audible')
    }
    const onPause = () => {
      if (audio !== audioRef.current) return
      updateStatus(manuallyPausedRef.current || !wantsPlaybackRef.current ? 'paused' : 'blocked')
    }
    const onError = () => {
      if (audio === audioRef.current) updateStatus('error')
    }
    const onEnded = () => {
      if (audio !== audioRef.current) return
      ++playAttemptRef.current
      wantsPlaybackRef.current = false
      updateStatus('paused')
    }
    const resumeOnGesture = (event: Event) => {
      if (
        !event.isTrusted
        || manuallyPausedRef.current
        || !wantsPlaybackRef.current
        || statusRef.current === 'playing-audible'
        || statusRef.current === 'error'
      ) return
      if (event.target instanceof Element && event.target.closest('.music-toggle')) return
      if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return
      requestPlayback()
    }
    const resumeAfterPageReturn = () => {
      if (
        document.visibilityState === 'visible'
        && wantsPlaybackRef.current
        && !manuallyPausedRef.current
        && audio.paused
        && statusRef.current !== 'error'
      ) requestPlayback()
    }

    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    audio.addEventListener('ended', onEnded)
    window.addEventListener('pointerup', resumeOnGesture, { capture: true })
    window.addEventListener('touchend', resumeOnGesture, { capture: true, passive: true })
    window.addEventListener('click', resumeOnGesture, { capture: true })
    window.addEventListener('keydown', resumeOnGesture, { capture: true })
    window.addEventListener('pageshow', resumeAfterPageReturn)
    document.addEventListener('visibilitychange', resumeAfterPageReturn)

    requestPlayback()

    return () => {
      ++playAttemptRef.current
      audioRef.current = null
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('ended', onEnded)
      window.removeEventListener('pointerup', resumeOnGesture, { capture: true })
      window.removeEventListener('touchend', resumeOnGesture, { capture: true })
      window.removeEventListener('click', resumeOnGesture, { capture: true })
      window.removeEventListener('keydown', resumeOnGesture, { capture: true })
      window.removeEventListener('pageshow', resumeAfterPageReturn)
      document.removeEventListener('visibilitychange', resumeAfterPageReturn)
      if (window.engagementSoundtrackAudio === audio) window.engagementSoundtrackAudio = undefined
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audio.remove()
    }
  }, [requestPlayback, updateStatus])

  return {
    status,
    playing: status === 'playing-audible',
    audible: status === 'playing-audible',
    toggle,
  }
}
