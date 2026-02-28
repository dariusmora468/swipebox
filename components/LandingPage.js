'use client';
import { useState, useEffect, useCallback } from 'react';
import GoogleIcon from './GoogleIcon';

// ─── Demo card data (fun & fictional) ─────────────────────
const DEMO_CARDS = [
  {
    id: 'demo-1',
    from: 'Project Update Bot',
    email: 'updates@workspace.io',
    subject: 'Weekly digest: 5 tasks completed',
    summary: 'Your team crushed it this week! 5 tasks shipped, 2 PRs merged, and zero incidents. Here\'s the full breakdown...',
    category: 'Updates',
    action: 'mark_read',
    direction: 'right',
    badge: { label: 'READ', color: '#A0775A' },
    avatar: '📊',
    color: '#A0775A',
  },
  {
    id: 'demo-2',
    from: 'Your Future Self',
    email: 'you@2030.future',
    subject: 'Hey — don\'t forget that thing',
    summary: 'You know what I\'m talking about. That thing you keep putting off. Snooze this and deal with it tomorrow, like we both know you will.',
    category: 'Personal',
    action: 'snooze',
    direction: 'left',
    badge: { label: 'SNOOZE', color: '#B8963E' },
    avatar: '🔮',
    color: '#B8963E',
  },
  {
    id: 'demo-3',
    from: 'Pizza Planet Newsletter',
    email: 'deals@pizzaplanet.fake',
    subject: '🍕 50% Off Infinity Breadsticks — TODAY ONLY',
    summary: 'Congratulations! You\'ve been selected for unlimited breadsticks. Click now before this once-in-a-lifetime offer expires in 3... 2...',
    category: 'Promo',
    action: 'unsubscribe',
    direction: 'down',
    badge: { label: 'UNSUB', color: '#B07070' },
    avatar: '🍕',
    color: '#B07070',
  },
  {
    id: 'demo-4',
    from: 'Best Friend',
    email: 'bestie@friends.co',
    subject: 'Dinner tonight?',
    summary: 'Hey! Want to grab dinner at that new place downtown? I heard they have amazing pasta. Let me know!',
    category: 'Personal',
    action: 'send',
    direction: 'up',
    badge: { label: 'SEND', color: '#7A8C6E' },
    avatar: '👋',
    color: '#7A8C6E',
    aiReply: 'Sounds great! I\'m in — see you at 7?',
  },
];

// ─── Animated demo card component ─────────────────────────
function DemoCard({ card, phase, index, total }) {
  const isActive = index === 0;
  const isNext = index === 1;

  // Animation: fly away in the card's direction
  const getTransform = () => {
    if (!isActive) {
      return `translateX(-50%) scale(${isNext ? 0.96 : 0.92}) translateY(${index * 8}px)`;
    }
    if (phase === 'swiping') {
      const dir = card.direction;
      const dist = 400;
      const x = dir === 'right' ? dist : dir === 'left' ? -dist : 0;
      const y = dir === 'up' ? -dist : dir === 'down' ? dist : 0;
      return `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${x * 0.04}deg)`;
    }
    if (phase === 'dragging') {
      const dir = card.direction;
      const drag = 80;
      const x = dir === 'right' ? drag : dir === 'left' ? -drag : 0;
      const y = dir === 'up' ? -drag : dir === 'down' ? drag : 0;
      return `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${x * 0.03}deg)`;
    }
    return 'translateX(-50%)';
  };

  const getOpacity = () => {
    if (phase === 'swiping' && isActive) return 0;
    if (!isActive && !isNext) return 0.4;
    return 1;
  };

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      maxWidth: '320px',
      left: '50%',
      top: isActive ? '0' : '8px',
      transform: getTransform(),
      transition: phase === 'swiping' && isActive
        ? 'transform 0.45s ease-in, opacity 0.4s ease-in'
        : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      opacity: getOpacity(),
      zIndex: total - index,
      pointerEvents: 'none',
    }}>
      <div style={{
        background: '#FDFBF9',
        borderRadius: '16px',
        border: '1px solid rgba(120,100,80,0.1)',
        boxShadow: isActive
          ? '0 2px 8px rgba(60,45,30,0.06), 0 8px 32px rgba(60,45,30,0.1)'
          : '0 2px 12px rgba(60,45,30,0.04)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Top accent */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
          borderRadius: '0 0 2px 2px',
          background: `linear-gradient(90deg, transparent, ${card.color}40, transparent)`,
          opacity: isActive ? 0.6 : 0,
        }} />

        {/* Action badge overlay */}
        {isActive && (phase === 'dragging' || phase === 'swiping') && (
          <div style={{
            position: 'absolute',
            top: card.direction === 'down' ? 'auto' : '16px',
            bottom: card.direction === 'down' ? '16px' : 'auto',
            left: card.direction === 'right' ? '16px' : card.direction === 'left' ? 'auto' : '50%',
            right: card.direction === 'left' ? '16px' : 'auto',
            transform: card.direction === 'up' || card.direction === 'down' ? 'translateX(-50%)' : `rotate(${card.direction === 'right' ? 12 : -12}deg)`,
            opacity: phase === 'swiping' ? 1 : 0.8,
            transition: 'opacity 0.2s',
            zIndex: 10,
          }}>
            <div style={{
              border: `2px solid ${card.badge.color}`,
              borderRadius: '8px',
              padding: '5px 14px',
              color: card.badge.color,
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '2px',
              fontFamily: "'Playfair Display', Georgia, serif",
              background: 'rgba(253,251,249,0.92)',
              boxShadow: `0 0 16px ${card.badge.color}30`,
            }}>{card.badge.label}</div>
          </div>
        )}

        <div style={{ padding: '18px 18px 0' }}>
          {/* Sender row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `${card.color}10`, border: `1px solid ${card.color}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
            }}>{card.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#2C2520', fontFamily: "'Playfair Display', Georgia, serif" }}>{card.from}</div>
              <div style={{ fontSize: '10px', color: '#9C8E82' }}>{card.email}</div>
            </div>
          </div>
          {/* Subject */}
          <h3 style={{
            fontFamily: "Georgia, serif", fontSize: '14px', fontWeight: 700,
            color: '#2C2520', margin: '0 0 6px', lineHeight: 1.4,
          }}>{card.subject}</h3>
          {/* Summary */}
          <p style={{
            fontSize: '12px', color: '#6B5E54', lineHeight: 1.6, margin: '0 0 14px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{card.summary}</p>
        </div>

        {/* AI Reply preview for send card */}
        {card.aiReply && (
          <div style={{ padding: '0 18px 16px' }}>
            <div style={{
              padding: '10px', borderRadius: '10px',
              background: 'rgba(122,140,110,0.06)', border: '1px solid rgba(122,140,110,0.1)',
            }}>
              <div style={{
                fontSize: '9px', fontWeight: 600, color: '#7A8C6E', marginBottom: '4px',
                textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>AI Draft Reply</div>
              <p style={{ fontSize: '11px', color: '#4A433C', lineHeight: 1.5, margin: 0 }}>{card.aiReply}</p>
            </div>
          </div>
        )}

        {!card.aiReply && (
          <div style={{ height: '16px' }} />
        )}
      </div>
    </div>
  );
}

// ─── Swipe direction indicator ────────────────────────────
function SwipeIndicator({ card, phase }) {
  if (phase !== 'dragging' && phase !== 'swiping') return null;

  const arrows = {
    down: { symbol: '↓', label: 'Unsubscribe' },
    left: { symbol: '←', label: 'Snooze' },
    up: { symbol: '↑', label: 'Send Reply' },
    right: { symbol: '→', label: 'Mark Read' },
  };

  const a = arrows[card.direction];
  return (
    <div style={{
      position: 'absolute',
      bottom: '-36px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      opacity: phase === 'swiping' ? 0 : 0.8,
      transition: 'opacity 0.3s',
    }}>
      <span style={{
        fontSize: '14px',
        color: card.badge.color,
        fontWeight: 600,
        fontFamily: "'Playfair Display', Georgia, serif",
        letterSpacing: '0.5px',
      }}>{a.symbol} {a.label}</span>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────
export default function LandingPage({ onGetStarted, onHaveInvite }) {
  // Animation state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle, dragging, swiping, pause
  const [visibleCards, setVisibleCards] = useState(DEMO_CARDS);
  const [cycleKey, setCycleKey] = useState(0);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState(null); // null, 'sending', 'success', 'error'
  const [waitlistMessage, setWaitlistMessage] = useState('');

  // Promo code state
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState(null); // null, 'checking', 'success', 'error'
  const [promoMessage, setPromoMessage] = useState('');

  // Animate the demo cards in sequence
  useEffect(() => {
    if (visibleCards.length === 0) {
      // Reset after all cards have been swiped
      const t = setTimeout(() => {
        setVisibleCards(DEMO_CARDS);
        setCycleKey(k => k + 1);
        setPhase('idle');
      }, 800);
      return () => clearTimeout(t);
    }

    const sequence = async () => {
      // Wait before starting each card's animation
      await new Promise(r => setTimeout(r, 1400));
      if (visibleCards.length === 0) return;
      setPhase('dragging');
      await new Promise(r => setTimeout(r, 600));
      if (visibleCards.length === 0) return;
      setPhase('swiping');
      await new Promise(r => setTimeout(r, 500));
      setVisibleCards(prev => prev.slice(1));
      setPhase('idle');
    };

    const controller = new AbortController();
    sequence();
    return () => controller.abort();
  }, [visibleCards.length, cycleKey]);

  // Waitlist submit
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistEmail || waitlistStatus === 'sending') return;
    setWaitlistStatus('sending');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlistStatus('success');
        setWaitlistMessage(data.message || 'You\'re on the list!');
        setWaitlistEmail('');
      } else {
        setWaitlistStatus('error');
        setWaitlistMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setWaitlistStatus('error');
      setWaitlistMessage('Could not connect. Please try again.');
    }
  };

  // Promo code submit
  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    if (!promoCode || promoStatus === 'checking') return;
    setPromoStatus('checking');
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setPromoStatus('success');
        setPromoMessage('Welcome in!');
        // Store promo validation and proceed
        if (typeof window !== 'undefined') {
          localStorage.setItem('swipebox_promo_validated', 'true');
          localStorage.setItem('swipebox_promo_code', promoCode);
        }
        setTimeout(() => onHaveInvite(), 600);
      } else {
        setPromoStatus('error');
        setPromoMessage(data.error || 'Invalid code. Please check and try again.');
      }
    } catch {
      setPromoStatus('error');
      setPromoMessage('Could not verify. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0EB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize: '20px',
          color: '#2C2520',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>SwipeBox</div>
      </div>

      {/* Hero Section */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        padding: '0 24px',
        textAlign: 'center',
        marginTop: '8px',
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(28px, 6vw, 40px)',
          fontWeight: 700,
          color: '#2C2520',
          lineHeight: 1.2,
          margin: '0 0 12px',
          letterSpacing: '-0.3px',
        }}>
          Swipe to inbox zero<br />
          <span style={{ color: '#A0775A' }}>in just a few minutes</span>
        </h1>
      </div>

      {/* Animated Demo */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        height: '280px',
        position: 'relative',
        margin: '0 auto 28px',
        padding: '0 24px',
      }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {visibleCards.slice(0, 3).reverse().map((card, i) => {
            const realIndex = visibleCards.slice(0, 3).length - 1 - i;
            return (
              <DemoCard
                key={`${cycleKey}-${card.id}`}
                card={card}
                phase={realIndex === 0 ? phase : 'idle'}
                index={realIndex}
                total={visibleCards.length}
              />
            );
          })}
          {visibleCards.length > 0 && (
            <SwipeIndicator card={visibleCards[0]} phase={phase} />
          )}
        </div>
      </div>

      {/* CTAs Section */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '0 24px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Waitlist form */}
        <div style={{ width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#9C8E82', marginBottom: '10px' }}>
            Or join the waitlist for early access
          </p>
          {waitlistStatus === 'success' ? (
            <div style={{
              padding: '14px 20px',
              borderRadius: '12px',
              background: 'rgba(122,140,110,0.08)',
              border: '1px solid rgba(122,140,110,0.15)',
              color: '#7A8C6E',
              fontSize: '14px',
              fontWeight: 500,
            }}>
              {waitlistMessage}
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} style={{
              display: 'flex',
              gap: '8px',
              width: '100%',
            }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(120,100,80,0.12)',
                  background: '#FDFBF9',
                  fontSize: '14px',
                  color: '#2C2520',
                  outline: 'none',
                }}
              />
              <button type="submit" disabled={waitlistStatus === 'sending'} style={{
                padding: '12px 20px',
                borderRadius: '12px',
                background: '#A0775A',
                color: '#FDFBF9',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                opacity: waitlistStatus === 'sending' ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}>
                {waitlistStatus === 'sending' ? '...' : 'Join'}
              </button>
            </form>
          )}
          {waitlistStatus === 'error' && (
            <p style={{ fontSize: '12px', color: '#B07070', marginTop: '6px' }}>{waitlistMessage}</p>
          )}
        </div>

        {/* Divider */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '4px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(120,100,80,0.1)' }} />
          <span style={{ fontSize: '11px', color: '#B8A99A', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(120,100,80,0.1)' }} />
        </div>

        {/* Secondary CTA: I have an invite */}
        {!showPromoInput ? (
          <button
            onClick={() => setShowPromoInput(true)}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              background: 'transparent',
              color: '#A0775A',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid rgba(160,119,90,0.2)',
              cursor: 'pointer',
              letterSpacing: '0.2px',
            }}
          >
            I have an invite code
          </button>
        ) : (
          <div style={{ width: '100%' }}>
            {promoStatus === 'success' ? (
              <div style={{
                padding: '14px 20px',
                borderRadius: '12px',
                background: 'rgba(122,140,110,0.08)',
                border: '1px solid rgba(122,140,110,0.15)',
                color: '#7A8C6E',
                fontSize: '14px',
                fontWeight: 500,
                textAlign: 'center',
              }}>
                {promoMessage}
              </div>
            ) : (
              <form onSubmit={handlePromoSubmit} style={{
                display: 'flex',
                gap: '8px',
                width: '100%',
              }}>
                <input
                  type="text"
                  placeholder="Enter invite code"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  autoFocus
                  required
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(120,100,80,0.12)',
                    background: '#FDFBF9',
                    fontSize: '14px',
                    color: '#2C2520',
                    outline: 'none',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                />
                <button type="submit" disabled={promoStatus === 'checking'} style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: '#A0775A',
                  color: '#FDFBF9',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  opacity: promoStatus === 'checking' ? 0.7 : 1,
                }}>
                  {promoStatus === 'checking' ? '...' : 'Enter'}
                </button>
              </form>
            )}
            {promoStatus === 'error' && (
              <p style={{ fontSize: '12px', color: '#B07070', marginTop: '6px', textAlign: 'center' }}>{promoMessage}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px 24px 32px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <a href="/privacy" style={{ fontSize: '12px', color: '#A0775A', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</a>
          <span style={{ fontSize: '12px', color: '#D5CDC5' }}>{'\u00B7'}</span>
          <a href="/terms" style={{ fontSize: '12px', color: '#A0775A', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
