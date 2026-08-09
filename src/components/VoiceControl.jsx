import { useEffect, useMemo, useRef, useState } from 'react'
import { parseVoiceCommand } from './VoiceCommandParser.js'

export default function VoiceControl({
  enabled,
  onEnabledChange,
  onCommand,
  voiceReply,
  compact,
  onFeedback
}) {
  const [isListening, setIsListening] = useState(false)
  const [feedback, setFeedback] = useState('')
  const recognitionRef = useRef(null)
  const listenRef = useRef(false)
  const commandRef = useRef(onCommand)
  const replyRef = useRef(voiceReply)

  useEffect(() => {
    commandRef.current = onCommand
    replyRef.current = voiceReply
  }, [onCommand, voiceReply])

  const isSupported = useMemo(() => {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  }, [])

  useEffect(() => {
    if (!isSupported) {
      return undefined
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = true

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
      const parsed = parseVoiceCommand(transcript)
      const response = commandRef.current(parsed, transcript)
      if (response?.message) {
        setFeedback(response.message)
        if (onFeedback) {
          onFeedback(response.message)
        }
      }
      if (replyRef.current && response?.speak) {
        const utterance = new SpeechSynthesisUtterance(response.speak)
        window.speechSynthesis.speak(utterance)
      }
    }

    recognition.onerror = () => {
      const message = 'Command not recognized. Please try again.'
      setFeedback(message)
      if (onFeedback) {
        onFeedback(message)
      }
      setIsListening(false)
      listenRef.current = false
      onEnabledChange(false)
    }

    recognition.onend = () => {
      if (listenRef.current) {
        recognition.start()
        return
      }
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [isSupported, onFeedback, onEnabledChange])

  const toggleListening = () => {
    if (!isSupported) {
      return
    }
    if (isListening) {
      listenRef.current = false
      recognitionRef.current?.stop()
      setIsListening(false)
      onEnabledChange(false)
      return
    }
    listenRef.current = true
    setFeedback('Listening for commands...')
    recognitionRef.current?.start()
    setIsListening(true)
    onEnabledChange(true)
  }

  if (compact) {
    return (
      <button
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900 ${
          isListening ? 'bg-ember text-white border-ember dark:border-ember dark:text-white' : ''
        }`}
        type="button"
        onClick={toggleListening}
        disabled={!isSupported}
        aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
        title={isListening ? 'Voice Listening On' : 'Voice Listening Off'}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
          <path
            fill="currentColor"
            d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V20h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.07A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"
          />
        </svg>
      </button>
    )
  }

  return (
    <section className="rounded-3xl border border-clay/60 bg-white/85 p-4 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Voice Commands</h2>
        <button
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900 ${
            isListening ? 'bg-ember text-white border-ember dark:border-ember dark:text-white' : ''
          }`}
          type="button"
          onClick={toggleListening}
          disabled={!isSupported}
          aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
          title={isListening ? 'Voice Listening On' : 'Voice Listening Off'}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V20h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.07A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"
            />
          </svg>
        </button>
      </div>
      <div className="mt-3 text-xs text-ink/60 dark:text-slate-300">
        {isSupported ? (isListening ? 'Listening for commands...' : 'Tap mic to start listening') : 'Speech recognition not supported'}
      </div>
      {feedback ? <p className="mt-3 text-sm text-ink/70 dark:text-slate-200">{feedback}</p> : null}
      <p className="mt-3 text-xs text-ink/60 dark:text-slate-300">
        Try: "Add target at 4 5", "Move target from 4 5 to 6 7", "Set grid to 10 by 10"
      </p>
    </section>
  )
}
