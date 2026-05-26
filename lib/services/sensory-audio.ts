let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export type ASMRSoundType = 
  | 'water-drop' 
  | 'bubble' 
  | 'chime' 
  | 'mc-xp' 
  | 'mc-levelup' 
  | 'mc-anvil'

export const SensoryAudio = {
  // Must be called on user interaction (e.g. click anywhere on document) to unlock audio context
  init() {
    if (typeof window !== 'undefined') {
      try {
        const ctx = getAudioContext()
        // Play an empty buffer to truly unlock mobile browsers
        const buffer = ctx.createBuffer(1, 1, 22050)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.start(0)
      } catch (err) {
        console.warn('Failed to initialize audio context:', err)
      }
    }
  },
  isMuted(): boolean {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('sensory_sound_muted') === 'true'
  },

  setMuted(muted: boolean) {
    if (typeof window === 'undefined') return
    localStorage.setItem('sensory_sound_muted', String(muted))
  },

  getVolume(): number {
    if (typeof window === 'undefined') return 0.2 // Reduced base volume for calm mode
    const vol = localStorage.getItem('sensory_sound_volume')
    return vol !== null ? Number(vol) : 0.2
  },

  setVolume(volume: number) {
    if (typeof window === 'undefined') return
    // Clamp between 0.0 and 1.0
    const clamped = Math.max(0, Math.min(1, volume))
    localStorage.setItem('sensory_sound_volume', String(clamped))
  },

  getClickSound(): ASMRSoundType {
    if (typeof window === 'undefined') return 'bubble'
    return (localStorage.getItem('sensory_click_sound') as ASMRSoundType) || 'bubble'
  },

  setClickSound(sound: ASMRSoundType) {
    if (typeof window === 'undefined') return
    localStorage.setItem('sensory_click_sound', sound)
  },

  playClick() {
    this.init() // Ensure initialized
    this.play(this.getClickSound())
  },

  play(type: ASMRSoundType) {
    if (typeof window === 'undefined' || this.isMuted()) return

    try {
      const ctx = getAudioContext()
      const now = ctx.currentTime
      const volume = this.getVolume() * 0.5 // Reduce all sounds by 50% for extra calm padding

      if (type === 'water-drop') {
        // Organic water drop "plop" sweep
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.type = 'sine'
        // Sweep quickly upward in frequency
        osc.frequency.setValueAtTime(160, now)
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.08)
        
        // Soft rounded volume envelope
        gain.gain.setValueAtTime(0.001, now)
        gain.gain.linearRampToValueAtTime(0.15 * volume, now + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
        
        osc.start(now)
        osc.stop(now + 0.3)
      } 
      
      else if (type === 'bubble') {
        // Delicate tactile bubble pop
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(320, now)
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.03)
        
        gain.gain.setValueAtTime(0.08 * volume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
        
        osc.start(now)
        osc.stop(now + 0.08)
      } 
      
      else if (type === 'chime') {
        // Relaxing major 7th crystal chime chord (C5 - E5 - G5 - B5)
        const freqs = [523.25, 659.25, 783.99, 987.77]
        
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          
          osc.connect(gain)
          gain.connect(ctx.destination)
          
          osc.type = 'sine'
          osc.frequency.value = freq
          
          // Arpeggiate slightly (15ms delay per note) for an ethereal aura
          const startTime = now + (idx * 0.02)
          
          gain.gain.setValueAtTime(0.001, startTime)
          gain.gain.linearRampToValueAtTime(0.03 * volume, startTime + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8)
          
          osc.start(startTime)
          osc.stop(startTime + 1.0)
        })
      }


      else if (type === 'mc-xp') {
        // Satisfying high-pitched upward XP orb arpeggio
        const baseFreq = 850 + Math.random() * 350
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(baseFreq, now)
        osc.frequency.linearRampToValueAtTime(baseFreq * 1.45, now + 0.1)
        
        gain.gain.setValueAtTime(0.001, now)
        gain.gain.linearRampToValueAtTime(0.06 * volume, now + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
        
        osc.start(now)
        osc.stop(now + 0.13)
      }

      else if (type === 'mc-levelup') {
        // Ascending pentatonic retro level-up chord
        const freqs = [220, 261.63, 329.63, 392.00, 440, 523.25, 659.25, 783.99, 880]
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          
          osc.type = 'triangle'
          osc.frequency.value = freq
          
          const noteStart = now + (idx * 0.07)
          gain.gain.setValueAtTime(0.001, noteStart)
          gain.gain.linearRampToValueAtTime(0.04 * volume, noteStart + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.5)
          
          osc.start(noteStart)
          osc.stop(noteStart + 0.6)
        })
      }

      else if (type === 'mc-anvil') {
        // Satisfying anvil high metallic chime resonance
        const freqs = [440, 443, 880, 1200]
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          
          osc.type = idx === 0 ? 'sine' : 'sawtooth'
          osc.frequency.value = freq
          
          gain.gain.setValueAtTime(0.001, now)
          gain.gain.linearRampToValueAtTime(0.02 * volume, now + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
          
          osc.start(now)
          osc.stop(now + 0.7)
        })
      }


    } catch (err) {
      console.warn('[SensoryAudio] Play failed (User interaction required):', err)
    }
  }
}
