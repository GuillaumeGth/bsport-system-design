import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  CHAPTERS,
  audioDownload,
  chapterAt,
  chapterSrc,
  formatTime,
  totalDuration,
} from '../lib/audio'
import './ListenView.css'

const SPEEDS = [0.9, 1, 1.15, 1.3, 1.5]
const SKIP_SECONDS = 15

export function ListenView({ onSelectSection }: { onSelectSection: (sectionId: string) => void }) {
  const { t, locale } = useI18n()
  const audioRef = useRef<HTMLAudioElement>(null)
  const chapters = CHAPTERS[locale]
  const total = totalDuration(chapters)

  const [index, setIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [speed, setSpeed] = useLocalStorage<number>('bsport.audioSpeed', 1)
  // La position survit au rechargement : on écoute ça en plusieurs fois.
  const [saved, setSaved] = useLocalStorage<number>(`bsport.audioPosition.${locale}`, 0)

  /** Position demandée dans le chapitre, appliquée dès qu'il est chargé. */
  const pending = useRef<{ at: number; play: boolean } | null>(null)

  const current = chapters[index] ?? chapters[0]
  const position = current.start + offset

  // Changer de langue change de découpage : on repart du début.
  useEffect(() => {
    setIndex(0)
    setOffset(0)
    setPlaying(false)
    setFailed(false)
    pending.current = null
  }, [locale])

  /** Se placer sur la frise complète, en changeant de chapitre si besoin. */
  const seek = useCallback(
    (seconds: number, play?: boolean) => {
      const target = Math.max(0, Math.min(seconds, total - 1))
      const chapter = chapterAt(chapters, target)
      const within = Math.max(0, target - chapter.start)
      const audio = audioRef.current
      const shouldPlay = play ?? playing

      if (chapter.index - 1 === index && audio) {
        audio.currentTime = within
        setOffset(within)
        if (shouldPlay) void audio.play()
        return
      }
      pending.current = { at: within, play: shouldPlay }
      setIndex(chapter.index - 1)
      setOffset(within)
    },
    [chapters, index, playing, total],
  )

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void audio.play()
    else audio.pause()
  }

  return (
    <section className="listen">
      <header className="listen__head">
        <p className="u-kicker">{t('listen.kicker')}</p>
        <h1 className="listen__title u-display">{t('listen.title')}</h1>
        <p className="listen__sub">{t('listen.sub')}</p>
      </header>

      <audio
        ref={audioRef}
        key={`${locale}-${index}`}
        src={chapterSrc(locale, current.index)}
        preload="auto"
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget
          audio.playbackRate = speed
          const request = pending.current
          pending.current = null
          if (request) {
            audio.currentTime = request.at
            if (request.play) void audio.play()
          } else if (saved > current.start && saved < current.start + current.duration) {
            audio.currentTime = saved - current.start
          }
        }}
        onTimeUpdate={(event) => {
          const within = event.currentTarget.currentTime
          setOffset(within)
          const absolute = current.start + within
          if (Math.abs(absolute - saved) > 5) setSaved(absolute)
        }}
        onEnded={() => {
          // Chapitre suivant, sans interrompre l'écoute.
          if (current.index < chapters.length) {
            pending.current = { at: 0, play: true }
            setIndex(current.index)
            setOffset(0)
          } else {
            setPlaying(false)
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />

      {failed ? (
        <p className="listen__error">{t('listen.unsupported')}</p>
      ) : (
        <div className="listen__player">
          <p className="listen__now">
            <span className="u-kicker">
              {t('listen.playing')} · {current.index}/{chapters.length}
            </span>
            <strong>{current.title}</strong>
          </p>

          <input
            className="listen__seek"
            type="range"
            min={0}
            max={total}
            step={1}
            value={position}
            aria-label={t('listen.seek')}
            onChange={(event) => seek(Number(event.target.value))}
          />

          <div className="listen__times u-mono">
            <span>{formatTime(position)}</span>
            <span>{formatTime(total)}</span>
          </div>

          <div className="listen__controls">
            <button
              type="button"
              className="listen__skip"
              onClick={() => seek(position - SKIP_SECONDS)}
              aria-label={t('listen.back')}
            >
              −{SKIP_SECONDS}s
            </button>

            <button
              type="button"
              className="listen__play"
              onClick={toggle}
              aria-label={playing ? t('listen.pause') : t('listen.play')}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M5 3h3v12H5zM10 3h3v12h-3z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M5 3l10 6-10 6z" fill="currentColor" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className="listen__skip"
              onClick={() => seek(position + SKIP_SECONDS)}
              aria-label={t('listen.forward')}
            >
              +{SKIP_SECONDS}s
            </button>

            <div className="listen__speed" role="group" aria-label={t('listen.speed')}>
              {SPEEDS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`listen__speedBtn u-mono${value === speed ? ' is-on' : ''}`}
                  aria-pressed={value === speed}
                  onClick={() => {
                    setSpeed(value)
                    if (audioRef.current) audioRef.current.playbackRate = value
                  }}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <h2 className="listen__chaptersTitle">{t('listen.chapters')}</h2>
      <ol className="listen__chapters">
        {chapters.map((chapter) => {
          const isCurrent = !failed && chapter.index === current.index
          return (
            <li key={chapter.index}>
              <div className={`chapter${isCurrent ? ' is-current' : ''}`}>
                <button
                  type="button"
                  className="chapter__jump"
                  onClick={() => seek(chapter.start, true)}
                >
                  <span className="chapter__time u-mono">{formatTime(chapter.start)}</span>
                  <span className="chapter__title">{chapter.title}</span>
                </button>
                <span className="chapter__sections">
                  {chapter.sections.map((sectionId) => (
                    <button
                      key={sectionId}
                      type="button"
                      className="chapter__section u-mono"
                      title={t('listen.readAlong')}
                      onClick={() => onSelectSection(sectionId)}
                    >
                      §{sectionId}
                    </button>
                  ))}
                </span>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="listen__download">
        <a href={audioDownload(locale)}>{t('listen.download')}</a>
      </p>
    </section>
  )
}
