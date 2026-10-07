import { useCallback, useEffect, useRef, useState } from 'react'

const YOUTUBE_VIDEO_ID = 'ZG0c7tYVby8'

type YouTubePlayer = {
  destroy: () => void
  getIframe: () => HTMLIFrameElement
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
  const [playing, setPlaying] = useState(false)
  const [waitingForGesture, setWaitingForGesture] = useState(true)

  const requestPlayback = useCallback(() => {
    wantsPlaybackRef.current = true
    manuallyPausedRef.current = false
    const player = playerRef.current
    if (player) {
      player.getIframe().dataset.playerStatus = 'request-play'
      player.unMute()
      player.setVolume(58)
      player.playVideo()
    }
    setWaitingForGesture(true)
  }, [])

  const pause = useCallback(() => {
    wantsPlaybackRef.current = false
    manuallyPausedRef.current = true
    playerRef.current?.pauseVideo()
    setPlaying(false)
    setWaitingForGesture(false)
  }, [])

  const toggle = useCallback(() => {
    if (playing) pause()
    else requestPlayback()
  }, [pause, playing, requestPlayback])

  useEffect(() => {
    let cancelled = false
    let player: YouTubePlayer | null = null

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
              event.target.setVolume(58)
              if (wantsPlaybackRef.current && !manuallyPausedRef.current) {
                event.target.unMute()
                event.target.seekTo(0, true)
                event.target.playVideo()
              }
            },
            onStateChange: (event) => {
              if (cancelled) return
              event.target.getIframe().dataset.playerStatus = `state-${event.data}`
              if (event.data === youtube.PlayerState.PLAYING) {
                if (manuallyPausedRef.current) {
                  event.target.pauseVideo()
                  return
                }
                setPlaying(true)
                setWaitingForGesture(false)
              } else if (event.data === youtube.PlayerState.PAUSED) {
                setPlaying(false)
                if (wantsPlaybackRef.current && !manuallyPausedRef.current) setWaitingForGesture(true)
              } else if (event.data === youtube.PlayerState.ENDED && wantsPlaybackRef.current) {
                event.target.seekTo(0, true)
                event.target.playVideo()
              }
            },
            onAutoplayBlocked: () => {
              if (cancelled) return
              player?.getIframe().setAttribute('data-player-status', 'autoplay-blocked')
              setPlaying(false)
              setWaitingForGesture(true)
            },
            onError: (event) => {
              if (cancelled) return
              event.target.getIframe().dataset.playerStatus = `error-${event.data}`
              setPlaying(false)
              setWaitingForGesture(true)
            },
          },
        })
        playerRef.current = player
        window.engagementSoundtrackPlayer = player
      })
      .catch(() => {
        if (!cancelled) {
          setPlaying(false)
          setWaitingForGesture(true)
        }
      })

    return () => {
      cancelled = true
      playerRef.current = null
      if (window.engagementSoundtrackPlayer === player) window.engagementSoundtrackPlayer = undefined
      try {
        player?.pauseVideo()
        player?.destroy()
      } catch {
        // The singleton guard may already have removed this player.
      }
      if (mount.isConnected) mount.remove()
    }
  }, [])

  useEffect(() => {
    if (!waitingForGesture || manuallyPausedRef.current) return

    const resume = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.music-toggle')) return
      requestPlayback()
    }
    window.addEventListener('pointerdown', resume, { capture: true })
    window.addEventListener('keydown', resume, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', resume, { capture: true })
      window.removeEventListener('keydown', resume, { capture: true })
    }
  }, [requestPlayback, waitingForGesture])

  return { playing, toggle }
}
