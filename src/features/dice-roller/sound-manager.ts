let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) {
    return null
  }

  if (!audioContext) {
    audioContext = new AudioContextCtor()
  }

  return audioContext
}

function playTone(frequency: number, durationMs: number, volume: number, type: OscillatorType) {
  const context = getAudioContext()
  if (!context) {
    return
  }

  if (context.state === 'suspended') {
    void context.resume()
  }

  const oscillator = context.createOscillator()
  const gainNode = context.createGain()
  const startTime = context.currentTime
  const duration = durationMs / 1000

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)

  gainNode.gain.setValueAtTime(0, startTime)
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

export function playRollSound() {
  playTone(140, 140, 0.03, 'triangle')
  playTone(180, 120, 0.02, 'sine')
}

export function playSettleSound() {
  playTone(420, 110, 0.02, 'square')
}
