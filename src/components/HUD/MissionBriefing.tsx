import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface MissionBriefingModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

const STEPS = [
  {
    id: '01',
    title: 'Epicenter inbound',
    body: 'A seismic rupture has been detected at a randomized hypocenter somewhere in Southern California. The map will lock onto the epicenter automatically — that is your ground zero. Magnitude is unknown until arrival.',
  },
  {
    id: '02',
    title: 'Identify vulnerable sectors',
    body: 'Red zones mark soils with low shear-wave velocity and high liquefaction potential — saturated, cohesionless sediments prone to cyclic pore-pressure failure. Hover them to pull sector intel. These are your priority targets.',
  },
  {
    id: '03',
    title: 'Deploy your $10M mitigation budget',
    body: 'Three tools available. Vertical drainage networks dissipate excess pore pressure in saturated sediments. Vibro-stone column rigs densify loose granular soils and reduce lateral spreading. Cement deep-soil mixing binds particles into a rigid composite mass. Choose wisely — budget is finite.',
  },
  {
    id: '04',
    title: 'Post-event assessment',
    body: 'Once the wave clears, you receive a full damage report: sector survival rates, civilian impact count, and a performance grade. The map stays live — pan the aftermath and see exactly what held and what failed.',
  },
];

export const MissionBriefingModal = ({ onConfirm, onClose }: MissionBriefingModalProps) => {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    STEPS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, i]);
      }, 200 + i * 180);
    });
  }, []);

  const handleConfirm = () => {
    setClosing(true);
    setTimeout(onConfirm, 350);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 350);
  };

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
              {/* Avatar */}
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
                  Capt. R. Vasquez
                </div>
                <div style={{ color: 'rgba(239,68,68,0.4)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
                  Seismic Response Command
                </div>
              </div>

              {/* Live dot */}
              <PulseDot />

              {/* Close */}
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
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={visibleSteps.includes(i) ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '11px 13px',
                    border: '1px solid rgba(220,38,38,0.12)',
                    background: 'rgba(220,38,38,0.02)',
                  }}
                >
                  <div style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                    color: '#dc2626', background: 'rgba(220,38,38,0.1)',
                    border: '1px solid rgba(220,38,38,0.28)',
                    padding: '3px 7px', flexShrink: 0, marginTop: '1px',
                    textTransform: 'uppercase',
                  }}>
                    {step.id}
                  </div>
                  <div>
                    <div style={{ color: '#ef4444', fontSize: '10px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: '5px' }}>
                      {step.title}
                    </div>
                    <div style={{ color: 'rgba(220,170,170,0.72)', fontSize: '11px', lineHeight: 1.65, letterSpacing: '0.02em' }}>
                      {step.body}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              borderTop: '1px solid rgba(220,38,38,0.18)',
              padding: '12px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ color: 'rgba(239,68,68,0.3)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Transmission secure // awaiting your order
              </div>
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PulseDot = () => {
  return (
    <motion.div
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: '#dc2626', flexShrink: 0,
      }}
    />
  );
};