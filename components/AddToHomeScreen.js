'use client';
import { useState, useEffect } from 'react';

// ─── Platform detection ──────────────────────────────────
function detectPlatform() {
  if (typeof navigator === 'undefined') return 'ios';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  return 'ios'; // Default to iOS (covers iPhone, iPad, Mac Safari)
}

// ─── Animated SVG Icons ──────────────────────────────────

function IosShareIcon({ animate }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Phone outline */}
      <rect x="14" y="4" width="36" height="56" rx="6" stroke="#2C2520" strokeWidth="2.5" fill="#FDFBF9" />
      <rect x="26" y="52" width="12" height="3" rx="1.5" fill="#D5CDC5" />
      {/* Share icon in center */}
      <g style={{
        transform: animate ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.6s ease-in-out',
      }}>
        {/* Box with arrow */}
        <rect x="24" y="24" width="16" height="14" rx="2" stroke="#A0775A" strokeWidth="2" fill="none" />
        <line x1="32" y1="30" x2="32" y2="16" stroke="#A0775A" strokeWidth="2" strokeLinecap="round" />
        <polyline points="27,20 32,15 37,20" stroke="#A0775A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function IosPlusIcon({ animate }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Phone outline */}
      <rect x="14" y="4" width="36" height="56" rx="6" stroke="#2C2520" strokeWidth="2.5" fill="#FDFBF9" />
      {/* Menu row simulation */}
      <rect x="20" y="22" width="24" height="20" rx="4" fill="rgba(160,119,90,0.08)" stroke="rgba(160,119,90,0.2)" strokeWidth="1.5" />
      {/* Plus icon */}
      <g style={{
        transform: animate ? 'scale(1.1)' : 'scale(1)',
        transformOrigin: '32px 32px',
        transition: 'transform 0.5s ease',
      }}>
        <rect x="29" y="26" width="6" height="12" rx="1" fill="#A0775A" />
        <rect x="26" y="29" width="12" height="6" rx="1" fill="#A0775A" />
      </g>
      <text x="32" y="50" textAnchor="middle" fontSize="6" fill="#9C8E82" fontFamily="Georgia, serif" fontWeight="600">Add to Home</text>
    </svg>
  );
}

function IosHomeIcon({ animate }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Home screen with app grid */}
      <rect x="14" y="4" width="36" height="56" rx="6" stroke="#2C2520" strokeWidth="2.5" fill="#FDFBF9" />
      {/* App icons grid */}
      <rect x="19" y="12" width="8" height="8" rx="2" fill="#D5CDC5" />
      <rect x="29" y="12" width="8" height="8" rx="2" fill="#D5CDC5" />
      <rect x="39" y="12" width="8" height="8" rx="2" fill="#D5CDC5" />
      <rect x="19" y="23" width="8" height="8" rx="2" fill="#D5CDC5" />
      <rect x="29" y="23" width="8" height="8" rx="2" fill="#D5CDC5" />
      <rect x="39" y="23" width="8" height="8" rx="2" fill="#D5CDC5" />
      {/* SwipeBox app icon — highlighted */}
      <g style={{
        transform: animate ? 'scale(1.15)' : 'scale(1)',
        transformOrigin: '23px 38px',
        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <rect x="19" y="34" width="8" height="8" rx="2" fill="#A0775A" />
        <text x="23" y="39.5" textAnchor="middle" fontSize="4.5" fill="#FDFBF9" fontWeight="700">S</text>
      </g>
      <text x="23" y="47" textAnchor="middle" fontSize="4" fill="#6B5E54" fontFamily="Georgia, serif">SwipeBox</text>
    </svg>
  );
}

function AndroidDotsIcon({ animate }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Phone outline */}
      <rect x="14" y="4" width="36" height="56" rx="6" stroke="#2C2520" strokeWidth="2.5" fill="#FDFBF9" />
      {/* Browser bar */}
      <rect x="18" y="10" width="28" height="6" rx="3" fill="rgba(120,100,80,0.06)" stroke="rgba(120,100,80,0.1)" strokeWidth="1" />
      {/* Three dots */}
      <g style={{
        transform: animate ? 'scale(1.2)' : 'scale(1)',
        transformOrigin: '44px 13px',
        transition: 'transform 0.5s ease',
      }}>
        <circle cx="44" cy="11" r="1.2" fill="#A0775A" />
        <circle cx="44" cy="13.5" r="1.2" fill="#A0775A" />
        <circle cx="44" cy="16" r="1.2" fill="#A0775A" />
      </g>
      {/* Menu dropdown */}
      <rect x="26" y="20" width="20" height="24" rx="3" fill="#FDFBF9" stroke="rgba(120,100,80,0.15)" strokeWidth="1.5" />
      <rect x="29" y="24" width="14" height="2.5" rx="1" fill="rgba(120,100,80,0.1)" />
      <rect x="29" y="29" width="14" height="2.5" rx="1" fill="rgba(160,119,90,0.2)" />
      <text x="36" y="31" textAnchor="middle" fontSize="3.5" fill="#A0775A" fontWeight="600">Install app</text>
      <rect x="29" y="34" width="14" height="2.5" rx="1" fill="rgba(120,100,80,0.1)" />
      <rect x="29" y="39" width="14" height="2.5" rx="1" fill="rgba(120,100,80,0.1)" />
    </svg>
  );
}

function AndroidInstallIcon({ animate }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Phone outline */}
      <rect x="14" y="4" width="36" height="56" rx="6" stroke="#2C2520" strokeWidth="2.5" fill="#FDFBF9" />
      {/* Install dialog */}
      <rect x="18" y="18" width="28" height="28" rx="4" fill="#FDFBF9" stroke="rgba(120,100,80,0.15)" strokeWidth="1.5" />
      {/* App icon preview */}
      <rect x="28" y="22" width="8" height="8" rx="2" fill="#A0775A" />
      <text x="32" y="27.5" textAnchor="middle" fontSize="5" fill="#FDFBF9" fontWeight="700">S</text>
      <text x="32" y="35" textAnchor="middle" fontSize="4" fill="#2C2520" fontWeight="600" fontFamily="Georgia, serif">SwipeBox</text>
      {/* Install button */}
      <g style={{
        transform: animate ? 'scale(1.08)' : 'scale(1)',
        transformOrigin: '32px 41px',
        transition: 'transform 0.5s ease',
      }}>
        <rect x="22" y="38" width="20" height="6" rx="3" fill="#A0775A" />
        <text x="32" y="42" textAnchor="middle" fontSize="4" fill="#FDFBF9" fontWeight="600">Install</text>
      </g>
    </svg>
  );
}

// ─── Step data ───────────────────────────────────────────

const IOS_STEPS = [
  {
    id: 'ios-1',
    label: 'Tap the share button',
    sublabel: 'At the bottom of Safari',
    Icon: IosShareIcon,
  },
  {
    id: 'ios-2',
    label: 'Tap "Add to Home Screen"',
    sublabel: 'Scroll down in the menu',
    Icon: IosPlusIcon,
  },
  {
    id: 'ios-3',
    label: 'SwipeBox is on your home screen!',
    sublabel: 'Open it like any other app',
    Icon: IosHomeIcon,
  },
];

const ANDROID_STEPS = [
  {
    id: 'android-1',
    label: 'Tap the menu (⋮)',
    sublabel: 'Top-right corner of Chrome',
    Icon: AndroidDotsIcon,
  },
  {
    id: 'android-2',
    label: 'Tap "Install app"',
    sublabel: 'Then confirm the install',
    Icon: AndroidInstallIcon,
  },
  {
    id: 'android-3',
    label: 'SwipeBox is on your home screen!',
    sublabel: 'Open it like any other app',
    Icon: IosHomeIcon, // Reuse the home icon
  },
];

// ─── Main Component ──────────────────────────────────────
export default function AddToHomeScreen({ onComplete }) {
  const [platform, setPlatform] = useState('ios');
  const [currentStep, setCurrentStep] = useState(0);
  const [animateIcon, setAnimateIcon] = useState(false);
  const [isAlreadyPWA, setIsAlreadyPWA] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    // Check if already running as PWA / standalone
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsAlreadyPWA(true);
    }
  }, []);

  const steps = platform === 'android' ? ANDROID_STEPS : IOS_STEPS;
  const step = steps[currentStep];

  // Animate the icon on each step
  useEffect(() => {
    setAnimateIcon(false);
    const t1 = setTimeout(() => setAnimateIcon(true), 400);
    const t2 = setTimeout(() => setAnimateIcon(false), 1200);
    const t3 = setTimeout(() => setAnimateIcon(true), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [currentStep]);

  // Auto-advance animation
  useEffect(() => {
    if (currentStep >= steps.length - 1) return;
    const timer = setTimeout(() => {
      setCurrentStep(s => s + 1);
    }, 2800);
    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  // If already in PWA mode, skip this screen
  if (isAlreadyPWA) {
    onComplete();
    return null;
  }

  const handleDone = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('swipebox_homescreen_shown', 'true');
    }
    onComplete();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0EB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(120,100,80,0.08)',
      }}>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700, fontSize: '20px', color: '#2C2520',
          letterSpacing: '1.5px', textTransform: 'uppercase',
        }}>SwipeBox</div>
        <button
          onClick={handleDone}
          style={{
            padding: '6px 14px', borderRadius: '20px',
            background: 'transparent', border: '1px solid rgba(120,100,80,0.1)',
            color: '#9C8E82', fontSize: '12px', fontWeight: 500,
            cursor: 'pointer',
          }}
        >Skip</button>
      </div>

      {/* Title area */}
      <div style={{
        padding: '32px 24px 16px',
        textAlign: 'center',
        maxWidth: '380px',
      }}>
        <div style={{
          fontSize: '40px',
          marginBottom: '14px',
          lineHeight: 1,
        }}>{'\u{1F4F1}'}</div>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '24px',
          fontWeight: 700,
          color: '#2C2520',
          margin: '0 0 8px',
          lineHeight: 1.3,
        }}>
          Add SwipeBox to your<br />home screen
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#9C8E82',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Use it like a real app — no app store needed
        </p>
      </div>

      {/* Platform toggle */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '3px',
        borderRadius: '12px',
        background: 'rgba(120,100,80,0.06)',
        margin: '8px 0 28px',
      }}>
        <button
          onClick={() => { setPlatform('ios'); setCurrentStep(0); }}
          style={{
            padding: '8px 20px',
            borderRadius: '10px',
            border: 'none',
            background: platform === 'ios' ? '#FDFBF9' : 'transparent',
            boxShadow: platform === 'ios' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            color: platform === 'ios' ? '#2C2520' : '#9C8E82',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >iPhone</button>
        <button
          onClick={() => { setPlatform('android'); setCurrentStep(0); }}
          style={{
            padding: '8px 20px',
            borderRadius: '10px',
            border: 'none',
            background: platform === 'android' ? '#FDFBF9' : 'transparent',
            boxShadow: platform === 'android' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            color: platform === 'android' ? '#2C2520' : '#9C8E82',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >Android</button>
      </div>

      {/* Step animation area */}
      <div style={{
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        width: '100%',
        maxWidth: '360px',
      }}>
        {/* Step dots */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '28px',
        }}>
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              style={{
                width: i === currentStep ? '28px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === currentStep ? '#A0775A' : i < currentStep ? '#C4A882' : 'rgba(120,100,80,0.15)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Animated icon */}
        <div style={{
          width: '160px',
          height: '160px',
          borderRadius: '24px',
          background: '#FDFBF9',
          border: '1.5px solid rgba(120,100,80,0.08)',
          boxShadow: '0 4px 20px rgba(60,45,30,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: animateIcon ? 'scale(1.02)' : 'scale(1)',
        }}>
          <div style={{ transform: 'scale(1.8)' }}>
            <step.Icon animate={animateIcon} />
          </div>
        </div>

        {/* Step label */}
        <div style={{
          textAlign: 'center',
          marginBottom: '8px',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#A0775A',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '10px',
          }}>
            Step {currentStep + 1} of {steps.length}
          </div>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '20px',
            fontWeight: 700,
            color: '#2C2520',
            margin: '0 0 6px',
            lineHeight: 1.3,
          }}>{step.label}</h3>
          <p style={{
            fontSize: '14px',
            color: '#9C8E82',
            margin: 0,
          }}>{step.sublabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '20px 24px 40px',
        display: 'flex',
        gap: '12px',
      }}>
        {currentStep < steps.length - 1 ? (
          <>
            <button
              onClick={handleDone}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '14px',
                background: 'transparent',
                border: '1.5px solid rgba(120,100,80,0.12)',
                color: '#9C8E82',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Skip for now
            </button>
            <button
              onClick={() => setCurrentStep(s => s + 1)}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #A0775A, #8B6549)',
                color: '#FDFBF9',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(160,119,90,0.25)',
              }}
            >
              Next
            </button>
          </>
        ) : (
          <button
            onClick={handleDone}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #A0775A, #8B6549)',
              color: '#FDFBF9',
              fontSize: '15px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(160,119,90,0.25)',
            }}
          >
            Start swiping
          </button>
        )}
      </div>
    </div>
  );
}
