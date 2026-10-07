import { useCallback, useEffect, useRef, useState } from 'react'

const YOUTUBE_VIDEO_ID = 'ZG0c7tYVby8'
const SOUNDTRACK_VOLUME = 58
const YOUTUBE_PLAYING_STATE = 1

export type SoundtrackStatus =
  | 'starting'
  | 'playing-audible'
  | 'playing-muted'
  | 'blocked'
  | 'paused'
  | 'error'

type YouTubePlayer = {
  destroy: () => void
  getIframe: () => HTMLIFrameElement
  getPlayerState: () => number
  isMuted: () => boolean
  mute: () => void
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setVolume: (volume: number) => void
  unMute: () => void
}

type YouTubeEvent = {
  data: number
  target: YouTubePlayer
}

type YouTubePlayerOptions = {
  width: string
  height: string
  videoId: string
  playerVars: Record<string, string | number>
  events: {
    onReady: (event: YouTubeEvent) => void
    onStateChange: (event: YouTubeEvent) => void
    onAutoplayBlocked: () => void
    onError: (event: YouTubeEvent) => void
  }
}

type YouTubeApi = {
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer
  PlayerState: {
    ENDED: number
    PAUSED: number
    PLAYING: number
  }
}

declare global {
  interface Window {
    YT?: YouTubeApi
    engagementSoundtrackPlayer?: YouTubePlayer
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.()
      if (window.YT?.Player) resolve(window.YT)
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-youtube-iframe-api]')
    if (existingScript) return

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.dataset.youtubeIframeApi = 'true'
    script.referrerPolicy = 'strict-origin-when-cross-origin'
    script.onerror = () => reject(new Error('The YouTube player could not be loaded.'))
    document.head.append(script)
  })

  return youtubeApiPromise
}

export function useSoundtrack() {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const wantsPlaybackRef = useRef(true)
  const manuallyPausedRef = useRef(false)
  const actualPlaybackRef = useRef(false)
  const lastGestureAttemptRef = useRef(0)
  const fallbackTimerRef = useRef<number | null>(null)
  const playbackCheckTimerRef = useRef<number | null>(null)
  const statusRef = useRef<SoundtrackStatus>('starting')
  const [status, setStatus] = useState<SoundtrackStatus>('starting')
  const [waitingForGesture, setWaitingForGesture] = useState(true)

  const updateStatus = useCallback((nextStatus: SoundtrackStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  const clearPlaybackCheck = useCallback(() => {
    if (playbackCheckTimerRef.current !== null) {
      window.clearTimeout(playbackCheckTimerRef.current)
      playbackCheckTimerRef.current = null
    }
  }, [])

  const verifyAudiblePlayback = useCallback((player: YouTubePlayer) => {
    if (
      player !== playerRef.current
      || manuallyPausedRef.current
      || !wantsPlaybackRef.current
    ) return false

    try {
      if (player.getPlayerState() === YOUTUBE_PLAYING_STATE && !player.isMuted()) {
        actualPlaybackRef.current = true
        updateStatus('playing-audible')
        setWaitingForGesture(false)
        return true
      }
    } catch {
      // The iframe may still be applying the first playback command.
    }
    return false
  }, [updateStatus])

  const schedulePlaybackCheck = useCallback((player: YouTubePlayer) => {
    clearPlaybackCheck()
    playbackCheckTimerRef.current = window.setTimeout(() => {
      if (verifyAudiblePlayback(player)) return
      playbackCheckTimerRef.current = window.setTimeout(() => {
        if (verifyAudiblePlayback(player)) return
        if (!manuallyPausedRef.current && wantsPlaybackRef.current) {
          updateStatus(player.isMuted() ? 'playing-muted' : 'blocked')
          setWaitingForGesture(true)
        }
      }, 650)
    }, 120)
  }, [clearPlaybackCheck, updateStatus, verifyAudiblePlayback])

  const requestPlayback = useCallback(() => {
    wantsPlaybackRef.current = true
    manuallyPausedRef.current = false
    clearFallbackTimer()
    updateStatus('starting')

    const player = playerRef.current
    if (!player) {
      setWaitingForGesture(true)
      return
    }

    player.getIframe().dataset.playerStatus = 'request-play'
    player.setVolume(SOUNDTRACK_VOLUME)
    player.unMute()
    player.playVideo()
    schedulePlaybackCheck(player)
  }, [clearFallbackTimer, schedulePlaybackCheck, updateStatus])

  const pause = useCallback(() => {
    clearFallbackTimer()
    clearPlaybackCheck()
    wantsPlaybackRef.current = false
    manuallyPausedRef.current = true
    actualPlaybackRef.current = false
    playerRef.current?.pauseVideo()
    updateStatus('paused')
    setWaitingForGesture(false)
  }, [clearFallbackTimer, clearPlaybackCheck, updateStatus])

  const toggle = useCallback(() => {
    if (statusRef.current === 'playing-audible') pause()
    else requestPlayback()
  }, [pause, requestPlayback])

  useEffect(() => {
    let cancelled = false
    let player: YouTubePlayer | null = null
    let mutedFallbackRequested = false

    const startMutedFallback = () => {
      if (
        cancelled
        || mutedFallbackRequested
        || manuallyPausedRef.current
        || !wantsPlaybackRef.current
        || !player
      ) return

      mutedFallbackRequested = true
      player.setVolume(SOUNDTRACK_VOLUME)
      player.mute()
      player.playVideo()
      setWaitingForGesture(true)
    }

    try {
      window.engagementSoundtrackPlayer?.pauseVideo()
      window.engagementSoundtrackPlayer?.destroy()
    } catch {
      // A stale development player may already have been removed.
    }
    window.engagementSoundtrackPlayer = undefined
    document.querySelectorAll('#background-soundtrack').forEach((node) => node.remove())

    const mount = document.createElement('div')
    mount.id = 'background-soundtrack'
    Object.assign(mount.style, {
      position: 'fixed',
      left: '0',
      bottom: '0',
      width: '200px',
      height: '200px',
      opacity: '0.001',
      pointerEvents: 'none',
      zIndex: '0',
    })
    document.body.append(mount)

    loadYouTubeApi()
      .then((youtube) => {
        if (cancelled) return
        player = new youtube.Player(mount, {
          width: '200',
          height: '200',
          videoId: YOUTUBE_VIDEO_ID,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            end: 315,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            loop: 1,
            modestbranding: 1,
            origin: window.location.origin,
            playlist: YOUTUBE_VIDEO_ID,
            playsinline: 1,
            rel: 0,
            start: 0,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return
              playerRef.current = event.target
              const iframe = event.target.getIframe()
              iframe.title = 'Jashn-E-Bahaaraa background music'
              iframe.tabIndex = -1
              iframe.setAttribute('aria-hidden', 'true')
              iframe.referrerPolicy = 'strict-origin-when-cross-origin'
              iframe.allow = 'autoplay; encrypted-media'
              iframe.dataset.playerStatus = 'ready'
              event.target.setVolume(SOUNDTRACK_VOLUME)

              if (wantsPlaybackRef.current && !manuallyPausedRef.current) {
                // Ask for audible autoplay first. If the browser refuses, the
                // fallback keeps the stream ready and the first touch unmutes it.
                event.target.unMute()
                event.target.playVideo()
                schedulePlaybackCheck(event.target)
                fallbackTimerRef.current = window.setTimeout(() => {
                  if (!actualPlaybackRef.current) startMutedFallback()
                }, 900)
              }
            },
            onStateChange: (event) => {
              if (cancelled) return
              event.target.getIframe().dataset.playerStatus = `state-${event.data}`

              if (event.data === youtube.PlayerState.PLAYING) {
                clearFallbackTimer()
                clearPlaybackCheck()
                actualPlaybackRef.current = true
                if (manuallyPausedRef.current || !wantsPlaybackRef.current) {
                  event.target.pauseVideo()
                  return
                }

                if (event.target.isMuted()) {
                  updateStatus('playing-muted')
                  setWaitingForGesture(true)
                } else {
                  mutedFallbackRequested = false
                  updateStatus('playing-audible')
                  setWaitingForGesture(false)
                }
              } else if (event.data === youtube.PlayerState.PAUSED) {
                clearPlaybackCheck()
                actualPlaybackRef.current = false
                if (manuallyPausedRef.current || !wantsPlaybackRef.current) {
                  updateStatus('paused')
                  setWaitingForGesture(false)
                } else {
                  updateStatus('blocked')
                  setWaitingForGesture(true)
                }
              } else if (event.data === youtube.PlayerState.ENDED && wantsPlaybackRef.current) {
                actualPlaybackRef.current = false
                event.target.seekTo(0, true)
                event.target.playVideo()
              }
            },
            onAutoplayBlocked: () => {
              if (cancelled || manuallyPausedRef.current || !wantsPlaybackRef.current) return
              clearPlaybackCheck()
              actualPlaybackRef.current = false
              player?.getIframe().setAttribute('data-player-status', 'autoplay-blocked')
              updateStatus('blocked')
              setWaitingForGesture(true)
              startMutedFallback()
            },
            onError: (event) => {
              if (cancelled) return
              clearFallbackTimer()
              clearPlaybackCheck()
              actualPlaybackRef.current = false
              event.target.getIframe().dataset.playerStatus = `error-${event.data}`
              updateStatus('error')
              setWaitingForGesture(false)
            },
          },
        })
        playerRef.current = player
        window.engagementSoundtrackPlayer = player
      })
      .catch(() => {
        if (!cancelled) {
          actualPlaybackRef.current = false
          updateStatus('error')
          setWaitingForGesture(false)
        }
      })

    const resumeAfterPageReturn = () => {
      if (
        document.visibilityState !== 'visible'
        || manuallyPausedRef.current
        || !wantsPlaybackRef.current
        || !playerRef.current
      ) return

      playerRef.current.setVolume(SOUNDTRACK_VOLUME)
      if (statusRef.current !== 'playing-muted' && statusRef.current !== 'blocked') {
        playerRef.current.unMute()
      }
      playerRef.current.playVideo()
    }

    window.addEventListener('pageshow', resumeAfterPageReturn)
    document.addEventListener('visibilitychange', resumeAfterPageReturn)

    return () => {
      cancelled = true
      clearFallbackTimer()
      clearPlaybackCheck()
      actualPlaybackRef.current = false
      playerRef.current = null
      window.removeEventListener('pageshow', resumeAfterPageReturn)
      document.removeEventListener('visibilitychange', resumeAfterPageReturn)
      if (window.engagementSoundtrackPlayer === player) window.engagementSoundtrackPlayer = undefined
      try {
        player?.pauseVideo()
        player?.destroy()
      } catch {
        // The singleton guard may already have removed this player.
      }
      if (mount.isConnected) mount.remove()
    }
  }, [clearFallbackTimer, clearPlaybackCheck, schedulePlaybackCheck, updateStatus])

  useEffect(() => {
    if (!waitingForGesture || manuallyPausedRef.current) return

    const resume = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.music-toggle')) return
      if (!playerRef.current) return
      const now = performance.now()
      if (now - lastGestureAttemptRef.current < 500) return
      lastGestureAttemptRef.current = now
      requestPlayback()
    }

    window.addEventListener('pointerup', resume, { capture: true })
    window.addEventListener('touchend', resume, { capture: true, passive: true })
    window.addEventListener('click', resume, { capture: true })
    window.addEventListener('keydown', resume, { capture: true })
    return () => {
      window.removeEventListener('pointerup', resume, { capture: true })
      window.removeEventListener('touchend', resume, { capture: true })
      window.removeEventListener('click', resume, { capture: true })
      window.removeEventListener('keydown', resume, { capture: true })
    }
  }, [requestPlayback, waitingForGesture])

  return {
    status,
    playing: status === 'playing-audible',
    audible: status === 'playing-audible',
    toggle,
  }
}
