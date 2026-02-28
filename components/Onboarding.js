'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

// ─── Onboarding demo emails (fun & fictional) ────────────
const ONBOARDING_STEPS = [
  {
    id: 'onboard-1',
    step: 1,
    instruction: 'Swipe down to unsubscribe',
    hint: '↓ Swipe the card downward',
    requiredDirection: 'down',
    email: {
      from: 'Galactic Deals Co.',
      emailAddr: 'spam@galacticdeals.fake',
      subject: '🚀 LAST CHANCE: 99% off Moon Cheese!!!',
      summary: 'You won\'t BELIEVE this deal! Artisan moon cheese, mined fresh from lunar craters. Only 3 wheels left in the ENTIRE galaxy...',
      category: 'Promo',
      avatar: '🌙',
      color: '#B07070',
      badge: { label: 'UNSUB', color: '#B07070' },
    },
  },
  {
    id: 'onboard-2',
    step: 2,
    instruction: 'Swipe left to snooze',
    hint: '← Swipe the card to the left',
    requiredDirection: 'left',
    email: {
      from: 'Procrastination HQ',
      emailAddr: 'later@procrastination.co',
      subject: 'Your dentist appointment is next week',
      summary: 'Hi! Just a reminder about your upcoming appointment. You\'ve rescheduled 4 times already. Maybe deal with this one later... again?',
      category: 'Reminder',
      avatar: '🦷',
      color: '#B8963E',
      badge: { label: 'SNOOZE', color: '#B8963E' },
    },
  },
  {
    id: 'onboard-3',
    step: 3,
    instruction: 'Tap the card to expand it',
    hint: 'Tap anywhere on the card',
    requiredDirection: 'tap',
    email: {
      from: 'Alex Chen',
      emailAddr: 'alex@coffeefriends.co',
      subject: 'Coffee this Saturday?',
      summary: 'Hey! It\'s been a while. Want to grab coffee this weekend? I found this amazing new place with the best oat milk lattes.',
      category: 'Personal',
      avatar: '☕',
      color: '#7A8C6E',
      aiReply: 'Sounds great! Saturday works for me. What time were you thinking?',
      badge: { label: 'SEND', color: '#7A8C6E' },
    },
  },
  {
    id: 'onboard-4',
    step: 4,
    instruction: 'Now swipe up to send the AI reply',
    hint: '↑ Swipe the card upward to send',
    requiredDirection: 'up',
    email: {
      from: 'Alex Chen',
      emailAddr: 'alex@coffeefriends.co',
      subject: 'Coffee this Saturday?',
      summary: 'Hey! It\'s been a while. Want to grab coffee this weekend? I found this amazing new place with the best oat milk lattes.',
      category: 'Personal',
      avatar: '☕',
      color: '#7A8C6E',
      aiReply: 'Sounds great! Saturday works for me. What time were you thinking?',
      badge: { label: 'SEND', color: '#7A8C6E' },
    },
  },
  {
    id: 'onboard-5',
    step: 5,
    instruction: 'Swipe right to mark as read',
    hint: '→ Swipe the card to the right',
    requiredDirection: 'right',
    email: {
      from: 'Team Standup Bot',
      emailAddr: 'standup@workspace.io',
      subject: '📊 Weekly team digest — all green!',
      summary: 'Everything\'s on track this week. 12 tasks completed, zero blockers, and your team\'s velocity is up 15%. Nice work!',
      category: 'Updates',
      avatar: '📊',
      color: '#A0775A',
      badge: { label: 'READ', color: '#A0775A' },
    },
  },
];

// ─── Interactive Onboarding Card ──────────────────────────
function OnboardingCard({ step, onCorrectSwipe, onTap }) {
  const cardRef = useRef(null);
  const dragStart = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [swipedAway, setSwipedAway] = useState(false);
  const [wrongSwipe, setWrongSwipe] = useState(false);
  const THRESHOLD = 80;
  const FLY_DISTANCE = 500;

  const email = step.email;

  const getSwipeDirection = useCallback(() => {
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    if (absX < THRESHOLD && absY < THRESHOLD) return null;
    if (absX > absY) return offset.x > 0 ? 'right' : 'left';
    return offset.y > 0 ? 'down' : 'up';
  }, [offset]);

  const getDirectionOpacity = useCallback((dir) => {
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    if (dir === 'right' && offset.x > 0) return absX / THRESHOLD;
    if (dir === 'left' && offset.x < 0) return absX / THRESHOLD;
    if (dir === 'up' && offset.y < 0) return absY / THRESHOLD;
    if (dir === 'down' && offset.y > 0) return absY / THRESHOLD;
    return 0;
  }, [offset]);

  const handlePointerDown = (e) => {
    if (swipedAway) return;
    if (step.requiredDirection === 'tap') {
      // Don't start drag for tap steps
    }
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setHasMoved(false);
    setWrongSwipe(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragStart.current || swipedAway) return;
    if (step.requiredDirection === 'tap') return; // No dragging on tap step
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setHasMoved(true);
    setOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging || swipedAway) return;

    // Handle tap steps
    if (step.requiredDirection === 'tap') {
      if (!hasMoved) {
        onTap();
      }
      setIsDragging(false);
      dragStart.current = null;
      return;
    }

    const dir = getSwipeDirection();
    if (dir) {
      if (dir === step.requiredDirection) {
        // Correct swipe! Fly away
        const flyTarget = {
          x: dir === 'right' ? FLY_DISTANCE : dir === 'left' ? -FLY_DISTANCE : 0,
          y: dir === 'up' ? -FLY_DISTANCE : dir === 'down' ? FLY_DISTANCE : 0,
        };
        setOffset(flyTarget);
        setSwipedAway(true);
        setTimeout(() => onCorrectSwipe(), 300);
      } else {
        // Wrong direction — bounce back with feedback
        setWrongSwipe(true);
        setOffset({ x: 0, y: 0 });
        setTimeout(() => setWrongSwipe(false), 800);
      }
    } else {
      setOffset({ x: 0, y: 0 });
    }
    setIsDragging(false);
    dragStart.current = null;
  };

  const rotation = offset.x * 0.04;
  const badgeOpacity = getDirectionOpacity(step.requiredDirection);

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : swipedAway ? 'transform 0.35s ease-in, opacity 0.3s ease-in' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: swipedAway ? 0 : 1,
        pointerEvents: swipedAway ? 'none' : 'auto',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{
        background: '#FDFBF9',
        borderRadius: '20px',
        border: wrongSwipe ? '2px solid rgba(176,112,112,0.3)' : '1px solid rgba(120,100,80,0.1)',
        boxShadow: '0 2px 8px rgba(60,45,30,0.06), 0 8px 32px rgba(60,45,30,0.1)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.3s',
      }}>
        {/* Top accent */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
          borderRadius: '0 0 2px 2px',
          background: `linear-gradient(90deg, transparent, ${email.color}40, transparent)`,
          opacity: 0.6,
        }} />

        {/* Action badge */}
        {badgeOpacity > 0.3 && (
          <div style={{
            position: 'absolute',
            top: step.requiredDirection === 'down' ? 'auto' : '24px',
            bottom: step.requiredDirection === 'down' ? '24px' : 'auto',
            left: step.requiredDirection === 'right' ? '24px' : step.requiredDirection === 'left' ? 'auto' : '50%',
            right: step.requiredDirection === 'left' ? '24px' : 'auto',
            transform: step.requiredDirection === 'up' || step.requiredDirection === 'down'
              ? 'translateX(-50%)'
              : `rotate(${step.requiredDirection === 'right' ? 12 : -12}deg)`,
            opacity: Math.min(badgeOpacity, 1),
            transition: 'opacity 0.1s',
            zIndex: 10,
          }}>
            <div style={{
              border: `2px solid ${email.badge.color}`,
              borderRadius: '10px',
              padding: '8px 20px',
              color: email.badge.color,
              fontWeight: 700,
              fontSize: '18px',
              letterSpacing: '2.5px',
              fontFamily: "'Playfair Display', Georgia, serif",
              background: 'rgba(253,251,249,0.92)',
              boxShadow: `0 0 24px ${email.badge.color}30`,
            }}>{email.badge.label}</div>
          </div>
        )}

        <div style={{ padding: '26px 24px 0' }}>
          {/* Sender row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `${email.color}10`, border: `1px solid ${email.color}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
            }}>{email.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#2C2520', fontFamily: "'Playfair Display', Georgia, serif" }}>{email.from}</div>
              <div style={{ fontSize: '11px', color: '#9C8E82' }}>{email.emailAddr}</div>
            </div>
          </div>

          {/* Tag */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              display: 'inline-block',
              padding: '3px 10px', borderRadius: '6px',
              background: 'rgba(120,100,80,0.05)', border: '1px solid rgba(120,100,80,0.08)',
              color: '#6B5E54', fontSize: '10px', fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>{email.category}</div>
          </div>

          {/* Subject */}
          <h3 style={{
            fontFamily: "Georgia, serif", fontSize: '17px', fontWeight: 700,
            color: '#2C2520', margin: '0 0 10px', lineHeight: 1.45,
          }}>{email.subject}</h3>

          {/* Summary */}
          <p style={{
            fontSize: '13.5px', color: '#6B5E54', lineHeight: 1.7, margin: '0 0 16px',
          }}>{email.summary}</p>
        </div>

        {/* AI Reply */}
        {email.aiReply && (
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{
              padding: '14px', borderRadius: '12px',
              background: 'rgba(122,140,110,0.06)', border: '1px solid rgba(122,140,110,0.1)',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: 600, color: '#7A8C6E', marginBottom: '8px',
                textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>AI Draft Reply</div>
              <p style={{ fontSize: '13px', color: '#4A433C', lineHeight: 1.65, margin: 0 }}>{email.aiReply}</p>
            </div>
          </div>
        )}

        {!email.aiReply && <div style={{ height: '24px' }} />}
      </div>

      {/* Wrong swipe feedback */}
      {wrongSwipe && (
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(176,112,112,0.1)',
          border: '1px solid rgba(176,112,112,0.2)',
          color: '#B07070',
          fontSize: '13px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          animation: 'fadeIn 0.2s ease',
        }}>
          Try the other direction!
        </div>
      )}
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────
export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const step = ONBOARDING_STEPS[currentStep];
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = ((currentStep) / totalSteps) * 100;

  const advanceStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1);
      setCardKey(k => k + 1);
      setExpanded(false);
    } else {
      // Onboarding complete
      onComplete();
    }
  }, [currentStep, totalSteps, onComplete]);

  const handleTap = useCallback(() => {
    if (step.requiredDirection === 'tap') {
      setExpanded(true);
    }
  }, [step]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0EB',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
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
          onClick={onComplete}
          style={{
            padding: '6px 14px', borderRadius: '20px',
            background: 'transparent', border: '1px solid rgba(120,100,80,0.1)',
            color: '#9C8E82', fontSize: '12px', fontWeight: 500,
            cursor: 'pointer',
          }}
        >Skip</button>
      </div>

      {/* Progress */}
      <div style={{ padding: '16px 24px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '10px',
        }}>
          <span style={{
            fontSize: '13px', fontWeight: 500, color: '#6B5E54',
          }}>Learn the basics</span>
          <span style={{
            fontSize: '13px', fontWeight: 600, color: '#A0775A',
          }}>{currentStep + 1} of {totalSteps}</span>
        </div>
        <div style={{
          height: '4px', borderRadius: '2px',
          background: 'rgba(120,100,80,0.08)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #A0775A, #C4845C)',
            transition: 'width 0.4s ease',
            borderRadius: '2px',
          }} />
        </div>
      </div>

      {/* Instruction */}
      <div style={{
        padding: '24px 24px 8px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '24px', fontWeight: 700, color: '#2C2520',
          margin: '0 0 8px',
        }}>{step.instruction}</h2>
        <p style={{
          fontSize: '14px', color: '#9C8E82', margin: 0,
          fontWeight: 500,
        }}>{step.hint}</p>
      </div>

      {/* Card area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 24px 40px',
        position: 'relative',
      }}>
        {/* Expanded email overlay */}
        {expanded && step.requiredDirection === 'tap' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{
              background: '#FDFBF9',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '440px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            }}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${step.email.color}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px',
                  }}>{step.email.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: '#2C2520', fontFamily: "'Playfair Display', Georgia, serif" }}>{step.email.from}</div>
                    <div style={{ fontSize: '12px', color: '#9C8E82' }}>{step.email.emailAddr}</div>
                  </div>
                </div>

                <h3 style={{
                  fontFamily: "Georgia, serif", fontSize: '19px', fontWeight: 700,
                  color: '#2C2520', margin: '0 0 14px', lineHeight: 1.4,
                }}>{step.email.subject}</h3>

                <p style={{
                  fontSize: '14px', color: '#6B5E54', lineHeight: 1.7, margin: '0 0 20px',
                }}>{step.email.summary}</p>

                {step.email.aiReply && (
                  <div style={{
                    padding: '16px', borderRadius: '14px',
                    background: 'rgba(122,140,110,0.06)', border: '1px solid rgba(122,140,110,0.1)',
                    marginBottom: '20px',
                  }}>
                    <div style={{
                      fontSize: '11px', fontWeight: 600, color: '#7A8C6E', marginBottom: '8px',
                      textTransform: 'uppercase', letterSpacing: '0.8px',
                    }}>AI Draft Reply</div>
                    <p style={{ fontSize: '14px', color: '#4A433C', lineHeight: 1.65, margin: 0 }}>{step.email.aiReply}</p>
                  </div>
                )}

                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <p style={{ fontSize: '13px', color: '#7A8C6E', fontWeight: 500, marginBottom: '12px' }}>
                    Great! You can read the full email and see the AI reply here.
                  </p>
                  <button
                    onClick={() => {
                      setExpanded(false);
                      advanceStep();
                    }}
                    style={{
                      padding: '14px 32px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #A0775A, #C4845C)',
                      color: '#FDFBF9',
                      fontSize: '15px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(160,119,90,0.2)',
                    }}
                  >
                    Got it! Next step →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <OnboardingCard
          key={cardKey}
          step={step}
          onCorrectSwipe={advanceStep}
          onTap={handleTap}
        />

        {/* Pulsing direction indicator */}
        {step.requiredDirection !== 'tap' && (
          <div style={{
            marginTop: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'pulse 2s ease infinite',
          }}>
            <span style={{
              fontSize: '20px',
              color: step.email.badge.color,
            }}>
              {step.requiredDirection === 'down' ? '↓' :
               step.requiredDirection === 'left' ? '←' :
               step.requiredDirection === 'up' ? '↑' : '→'}
            </span>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '14px',
              color: '#9C8E82',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}>
              {step.requiredDirection === 'down' ? 'Swipe down' :
               step.requiredDirection === 'left' ? 'Swipe left' :
               step.requiredDirection === 'up' ? 'Swipe up' : 'Swipe right'}
            </span>
          </div>
        )}

        {step.requiredDirection === 'tap' && !expanded && (
          <div style={{
            marginTop: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'pulse 2s ease infinite',
          }}>
            <span style={{ fontSize: '20px', color: '#A0775A' }}>👆</span>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '14px',
              color: '#9C8E82',
              fontWeight: 500,
            }}>Tap the card</span>
          </div>
        )}
      </div>
    </div>
  );
}
