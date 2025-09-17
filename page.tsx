"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Volume2, VolumeX, Play } from "lucide-react"

export default function AudioPerceptionTraining() {
  const [sessionActive, setSessionActive] = useState(false)
  const [currentDirection, setCurrentDirection] = useState<"left" | "right" | null>(null)
  const [showFeedback, setShowFeedback] = useState<"correct" | "wrong" | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [correctAttempts, setCorrectAttempts] = useState(0)
  const [sessionData, setSessionData] = useState<
    Array<{ direction: string; response: string; correct: boolean; timestamp: number }>
  >([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)

  const loadAudioFile = async () => {
    if (!audioContextRef.current) return

    try {
      const response = await fetch("/sounds/footsteps.mp3")
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
      audioBufferRef.current = audioBuffer
      console.log("[v0] Arquivo de áudio carregado com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao carregar arquivo de áudio:", error)
    }
  }

  const playFootstepsSound = (direction: "left" | "right") => {
    if (!soundEnabled || !audioContextRef.current || !audioBufferRef.current) {
      console.log("[v0] Som desabilitado ou contexto/buffer não disponível")
      return
    }

    const ctx = audioContextRef.current

    if (ctx.state === "suspended") {
      ctx.resume()
    }

    const source = ctx.createBufferSource()
    const gainNode = ctx.createGain()
    const pannerNode = ctx.createStereoPanner()

    source.buffer = audioBufferRef.current

    pannerNode.pan.setValueAtTime(direction === "left" ? -0.9 : 0.9, ctx.currentTime)

    gainNode.gain.setValueAtTime(0.8, ctx.currentTime)

    source.connect(gainNode)
    gainNode.connect(pannerNode)
    pannerNode.connect(ctx.destination)

    source.start(ctx.currentTime)
    console.log("[v0] Reproduzindo som de passos na direção:", direction)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      loadAudioFile()
    }
  }, [])

  const startNewTrial = () => {
    const directions: ("left" | "right")[] = ["left", "right"]
    const randomDirection = directions[Math.floor(Math.random() * directions.length)]

    setCurrentDirection(randomDirection)
    setShowFeedback(null)
    setIsPlaying(true)

    const delay = 800 + Math.random() * 400
    setTimeout(() => {
      console.log("[v0] Reproduzindo som de passos na direção:", randomDirection)
      playFootstepsSound(randomDirection)
      setIsPlaying(false)
    }, delay)
  }

  const handleResponse = (response: "left" | "right") => {
    if (!currentDirection || isPlaying) return

    const isCorrect = response === currentDirection
    const timestamp = Date.now()

    setSessionData((prev) => [
      ...prev,
      {
        direction: currentDirection,
        response,
        correct: isCorrect,
        timestamp,
      },
    ])

    setTotalAttempts((prev) => prev + 1)
    if (isCorrect) {
      setCorrectAttempts((prev) => prev + 1)
    }

    setShowFeedback(isCorrect ? "correct" : "wrong")

    setTimeout(() => {
      startNewTrial()
    }, 2000)
  }

  const startSession = () => {
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().then(() => {
        console.log("[v0] Contexto de áudio ativado")
      })
    }

    setSessionActive(true)
    setTotalAttempts(0)
    setCorrectAttempts(0)
    setSessionData([])
    startNewTrial()
  }

  const stopSession = () => {
    setSessionActive(false)
    setCurrentDirection(null)
    setShowFeedback(null)
    setIsPlaying(false)
  }

  const accuracy = totalAttempts > 0 ? ((correctAttempts / totalAttempts) * 100).toFixed(1) : "0.0"

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Sonar Tactical Nash</h1>
        <p className="text-muted-foreground">Sistema de Localização Sonora Direcional</p>
      </div>

      <Card className="w-full max-w-2xl p-8 bg-card border-2 border-primary/20">
        <div className="relative w-80 h-80 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
            <div className="absolute inset-4 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-8 rounded-full border border-primary/15"></div>
            <div className="absolute inset-12 rounded-full border border-primary/10"></div>

            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

            {sessionActive && (
              <div className="absolute top-1/2 left-1/2 w-px h-32 bg-gradient-to-t from-primary/60 to-transparent transform -translate-x-1/2 -translate-y-full origin-bottom radar-sweep"></div>
            )}

            {isPlaying && currentDirection && (
              <div
                className={`absolute top-1/2 ${currentDirection === "left" ? "left-8" : "right-8"} w-6 h-6 bg-accent rounded-full transform -translate-y-1/2 sonar-pulse border-2 border-accent/50`}
              ></div>
            )}

            <div className="absolute top-1/2 left-2 w-4 h-4 bg-blue-500/70 rounded-full transform -translate-y-1/2 flex items-center justify-center">
              <span className="text-xs font-bold text-white">L</span>
            </div>
            <div className="absolute top-1/2 right-2 w-4 h-4 bg-red-500/70 rounded-full transform -translate-y-1/2 flex items-center justify-center">
              <span className="text-xs font-bold text-white">R</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-lg font-bold text-primary">{totalAttempts}</div>
              <div className="text-muted-foreground">Tentativas</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600">{accuracy}%</div>
              <div className="text-muted-foreground">Precisão</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{correctAttempts}</div>
              <div className="text-muted-foreground">Corretas</div>
            </div>
          </div>

          {showFeedback && (
            <div
              className={`text-lg font-semibold mt-4 p-2 rounded ${showFeedback === "correct" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {showFeedback === "correct" ? "✓ Resposta Correta" : "✗ Resposta Incorreta"}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {!sessionActive ? (
            <Button onClick={startSession} size="lg" className="px-8">
              <Play className="w-4 h-4 mr-2" />
              Iniciar Sessão
            </Button>
          ) : (
            <Button onClick={stopSession} variant="destructive" size="lg" className="px-8">
              Finalizar Sessão
            </Button>
          )}

          <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="outline" size="lg" className="px-4">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        {sessionActive && (
          <div className="flex justify-center gap-8">
            <Button
              onClick={() => handleResponse("left")}
              disabled={isPlaying}
              size="lg"
              className="px-12 py-6 text-xl font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              ← Esquerda
            </Button>

            <Button
              onClick={() => handleResponse("right")}
              disabled={isPlaying}
              size="lg"
              className="px-12 py-6 text-xl font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              Direita →
            </Button>
          </div>
        )}

        <div className="text-center mt-6 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Protocolo:</strong> Ouça atentamente os sons de passos e identifique sua origem direcional.
          </p>
          <p>
            <strong>Recomendação:</strong> Use fones de ouvido estéreo para máxima precisão.
          </p>
          <p>
            <strong>Objetivo:</strong> Desenvolver acuidade na localização espacial de fontes sonoras em movimento.
          </p>
        </div>
      </Card>
    </div>
  )
}
