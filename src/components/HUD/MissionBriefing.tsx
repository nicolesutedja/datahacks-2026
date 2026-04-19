import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface MissionBriefingModalProps {
  onConfirm: () => void;
  onClose: () => void;
  isSfxMuted: boolean; // Add this prop to accept the global mute state
}

const STEPS = [
  {
    id: '01',
    title: 'EARTHQUAKE DETECTED',
    body: 'Seismic activity has been found. Magnitude has been determined. Ground zero is Southern California. Brace for arrival.',
  },
  {
    id: '02',
    title: 'SECTOR VULNERABILITY',
    body: 'Areas closer to the epicenter are at the highest risk of liquefaction and collapse. Prioritize these zones, they are the most vulnerable. Use your scanner to assess them now.',
  },
  {
    id: '03',
    title: 'DEFENSE PROTOCOL',
    body: 'A budget depending on scale has been authorized. Stabilize any priority areas before the wave hits. Time is a luxury we don’t have.',
  },
  {
    id: '04',
    title: 'IMPACT EVALUATION',
    body: 'Post-event data will confirm survival rates. Analysis is final. See what held, and what we lost. Good luck, recruit.',
  },
];

export const MissionBriefingModal = ({ onConfirm, onClose, isSfxMuted }: MissionBriefingModalProps) => {
  const [revealedCount, setRevealedCount] = useState(1);
  const [closing, setClosing] = useState(false);
  
  // Using a ref to track the actual Audio object for immediate stopping
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to kill audio instantly
  const killAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ""; // Clears the stream buffer
      audioRef.current = null;
    }
  };

  const speak = async (text: string) => {
    killAudio(); // Stop current speech before starting new one
    
    // Check if SFX is muted before making the API call
    if (isSfxMuted) return;

    const VOICE_ID = 'gVh6lddROTbOaOz9AAnY';

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5', // Faster response for better UI feel
            voice_settings: { stability: 0.4, similarity_boost: 0.8 },
          }),
        }
      );

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      
      // Double check mute state just in case it changed while fetching
      if (!isSfxMuted) {
        audio.play().catch(e => console.error("TTS playback prevented:", e));
      }
    } catch (err) {
      console.error('Comms failure:', err);
    }
  };

  // Keep the audio element's muted state in sync with the prop
  useEffect(() => {
     if (audioRef.current) {
         audioRef.current.muted = isSfxMuted;
         // Optionally pause it immediately if muted while playing
         if (isSfxMuted && !audioRef.current.paused) {
             audioRef.current.pause();
         }
     }
  }, [isSfxMuted]);

  useEffect(() => {
    if (!closing) {
      const currentStep = STEPS[revealedCount - 1];
      speak(`${currentStep.title}. ${currentStep.body}`);
    }
    return () => killAudio(); // Cleanup on unmount
  }, [revealedCount]);

  const handleConfirm = () => {
    killAudio(); // SILENCE IMMEDIATELY
    setClosing(true);
    setTimeout(onConfirm, 350);
  };

  const handleClose = () => {
    killAudio(); // SILENCE IMMEDIATELY
    setClosing(true);
    setTimeout(onClose, 350);
  };

  const handleNext = () => {
    if (revealedCount < STEPS.length) setRevealedCount(c => c + 1);
  };

  const isLastStep = revealedCount === STEPS.length;

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', fontFamily: "'Courier New', monospace" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.97, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 8, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#080808',
              border: '1px solid rgba(220,38,38,0.45)',
              boxShadow: '0 0 60px rgba(220,38,38,0.08)',
            }}
          >
            {/* Header */}
            <div style={{
              borderBottom: '1px solid rgba(220,38,38,0.2)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '40px', height: '40px',
                border: '1px solid rgba(220,38,38,0.45)',
                background: 'rgba(220,38,38,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  <path d="M12 2v2M7.5 4.5l1 1.5M16.5 4.5l-1 1.5" />
                </svg>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  Capt. Arthur Shock
                </div>
                <div style={{ color: 'rgba(239,68,68,0.4)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
                  Seismic Response Command
                </div>
              </div>

              <PulseDot />

              <div style={{ color: 'rgba(239,68,68,0.4)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {revealedCount} / {STEPS.length}
              </div>

              <button
                onClick={handleClose}
                style={{
                  background: 'none', border: '1px solid rgba(220,38,38,0.25)',
                  color: 'rgba(239,68,68,0.5)', width: '26px', height: '26px',
                  cursor: 'pointer', fontSize: '13px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.2s, color 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                  (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(220,38,38,0.25)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.5)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Steps */}
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {STEPS.map((step, i) => {
                const isRevealed = i < revealedCount;
                const isLatest = i === revealedCount - 1;
                return (
                  <AnimatePresence key={step.id}>
                    {isRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        style={{
                          display: 'flex', gap: '12px', alignItems: 'flex-start',
                          padding: '11px 13px',
                          border: `1px solid ${isLatest ? 'rgba(220,38,38,0.35)' : 'rgba(220,38,38,0.1)'}`,
                          background: isLatest ? 'rgba(220,38,38,0.05)' : 'rgba(220,38,38,0.01)',
                          transition: 'border-color 0.4s, background 0.4s',
                        }}
                      >
                        <div style={{
                          fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                          color: isLatest ? '#dc2626' : 'rgba(220,38,38,0.3)',
                          background: isLatest ? 'rgba(220,38,38,0.1)' : 'transparent',
                          border: `1px solid ${isLatest ? 'rgba(220,38,38,0.28)' : 'rgba(220,38,38,0.12)'}`,
                          padding: '3px 7px', flexShrink: 0, marginTop: '1px',
                          textTransform: 'uppercase',
                        }}>
                          {step.id}
                        </div>
                        <div>
                          <div style={{
                            color: isLatest ? '#ef4444' : 'rgba(239,68,68,0.35)',
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.13em',
                            textTransform: 'uppercase', marginBottom: '5px',
                          }}>
                            {step.title}
                          </div>
                          <div style={{
                            color: isLatest ? 'rgba(220,170,170,0.75)' : 'rgba(180,100,100,0.28)',
                            fontSize: '11px', lineHeight: 1.65, letterSpacing: '0.02em',
                          }}>
                            {step.body}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              borderTop: '1px solid rgba(220,38,38,0.18)',
              padding: '12px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ color: 'rgba(239,68,68,0.3)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {isLastStep
                  ? 'Transmission complete // awaiting your order'
                  : 'Transmission secure // continue reading'}
              </div>

              {isLastStep ? (
                <button
                  onClick={handleConfirm}
                  style={{
                    background: '#dc2626', border: 'none', color: '#000',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em',
                    textTransform: 'uppercase', padding: '9px 22px', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#dc2626'; }}
                >
                  Start the Mission ▶
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(220,38,38,0.45)',
                    color: '#ef4444',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em',
                    textTransform: 'uppercase', padding: '9px 22px', cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(220,38,38,0.45)';
                  }}
                >
                  Continue ▶
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PulseDot = () => (
  <motion.div
    animate={{ opacity: [1, 0.2, 1] }}
    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    style={{
      width: '7px', height: '7px', borderRadius: '50%',
      background: '#dc2626', flexShrink: 0,
    }}
  />
);