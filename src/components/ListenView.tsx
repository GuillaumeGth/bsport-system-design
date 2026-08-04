import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { AUDIO_DOWNLOAD, AUDIO_SRC, CHAPTERS, chapterAt, formatTime } from '../lib/audio'
import './ListenView.css'

const SPEEDS = [0.9, 1, 1.15, 1.3, 1.5]
const SKIP_SECONDS = 15

export function ListenView({ onSelectSection }: { onSelectSection: (sectionId: string) => void }) {
  const { t, locale } = useI18n()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [failed, setFailed] = useState(false)
  const [speed, setSpeed] = useLocalStorage<number>('bsport.audioSpeed', 1)
  // La position survit au rechargement : on écoute ça en plusieurs fois.
  const [saved, setSaved] = useLocalStorage<number>('bsport.audioPosition', 0)

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.playbackRate = speed
  }, [speed])

  const current = chapterAt(position)

  const seek = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds))
    setPosition(audio.currentTime)
  }

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
        src={AUDIO_SRC}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget
          setDuration(audio.duration)
          audio.playbackRate = speed
          if (saved > 0 && saved < audio.duration) audio.currentTime = saved
        }}
        onTimeUpdate={(event) => {
          const time = event.currentTarget.currentTime
          setPosition(time)
          if (Math.abs(time - saved) > 5) setSaved(time)
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
            <span className="u-kicker">{t('listen.playing')}</span>
            <strong>{current.title[locale]}</strong>
          </p>

          <input
            className="listen__seek"
            type="range"
            min={0}
            max={duration || 1}
            step={1}
            value={position}
            aria-label={t('listen.seek')}
            onChange={(event) => seek(Number(event.target.value))}
          />

          <div className="listen__times u-mono">
            <span>{formatTime(position)}</span>
            {/* Les métadonnées d'un fichier de 42 Mo mettent quelques secondes
                à arriver : sans ça, l'écran affiche 0:00 et paraît cassé. */}
            <span>{duration > 0 ? formatTime(duration) : t('listen.loading')}</span>
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
                  onClick={() => setSpeed(value)}
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
        {CHAPTERS.map((chapter) => {
          const isCurrent = !failed && chapter.index === current.index
          return (
            <li key={chapter.index}>
              <div className={`chapter${isCurrent ? ' is-current' : ''}`}>
                <button type="button" className="chapter__jump" onClick={() => seek(chapter.start)}>
                  <span className="chapter__time u-mono">{formatTime(chapter.start)}</span>
                  <span className="chapter__title">{chapter.title[locale]}</span>
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
        <a href={AUDIO_DOWNLOAD}>{t('listen.download')}</a>
      </p>
    </section>
  )
}
