'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSnoozeTime, addSnoozedEmail, clearExpiredSnoozes } from '../lib/snooze';
import { getState as getGamificationState, getLevelInfo, checkAndUpdateStreak, awardXP, calculateXP, addGems, DAILY_GOALS } from '../lib/gamification';
import SnoozePicker from '../components/SnoozePicker';
import EmailModal from '../components/EmailModal';
import UnsubscribeOverlay from '../components/UnsubscribeOverlay';
import SettingsModal from '../components/SettingsModal';
import EmailCard from '../components/EmailCard';
import ActionButton from '../components/ActionButton';
import SwipeSettingsModal, { AVAILABLE_ACTIONS, getSwipeMappings } from '../components/SwipeSettingsModal';
import ComposeCard from '../components/ComposeCard';
import CompletionScreen from '../components/CompletionScreen';
import LoadingScreen from '../components/LoadingScreen';
import LoginScreen from '../components/LoginScreen';
import GamificationBar from '../components/GamificationBar';
import XPBoostBanner from '../components/XPBoostBanner';
import ComboCounter from '../components/ComboCounter';
import CelebrationOverlay from '../components/CelebrationOverlay';
import StreakDetail from '../components/StreakDetail';

export default function SwipeBox() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [emails, setEmails] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [history, setHistory] = useState(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem('swipebox_history')) || []; } catch { return []; }
  });
  const [stats, setStats] = useState(() => {
    if (typeof window === "undefined") return { sent: 0, read: 0, snoozed: 0, unsubscribed: 0 };
    try { return JSON.parse(localStorage.getItem('swipebox_stats')) || { sent: 0, read: 0, snoozed: 0, unsubscribed: 0 }; } catch { return { sent: 0, read: 0, snoozed: 0, unsubscribed: 0 }; }
  });
  const [lastAction, setLastAction] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [actionInProgress, setActionInProgress] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSnoozePicker, setShowSnoozePicker] = useState(false);
  const [pendingSnoozeEmail, setPendingSnoozeEmail] = useState(null);
  const [showUnsubOverlay, setShowUnsubOverlay] = useState(false);
  const [unsubUrl, setUnsubUrl] = useState(null);
  const [unsubSender, setUnsubSender] = useState("");
  const [showSwipeSettings, setShowSwipeSettings] = useState(false);
  const [composeState, setComposeState] = useState(null);
  const [swipeMappings, setSwipeMappings] = useState(() => getSwipeMappings());
  const [unsubscribedSenders, setUnsubscribedSenders] = useState(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("swipebox_unsubscribed") || "[]"); } catch { return []; }
    }
    return [];
  });
  const [fetchError, setFetchError] = useState(null);

  // --- Gamification state ---
  const [gamState, setGamState] = useState(() => {
    if (typeof window === "undefined") return { totalXP: 0, dailyXP: 0, weeklyXP: 0, gems: 0, currentStreak: 0, longestStreak: 0, dailyGoal: "regular", dailyGoalMet: false, streakFreezes: 0, streakFrozenDates: [], activeDays: [], dailyEmailCount: 0 };
    return getGamificationState();
  });
  const [comboCount, setComboCount] = useState(0);
  const [lastXPAwarded, setLastXPAwarded] = useState(0);
  const [boostEndTime, setBoostEndTime] = useState(null);
  const [boostActive, setBoostActive] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [showStreakDetail, setShowStreakDetail] = useState(false);
  const [halfwayTriggered, setHalfwayTriggered] = useState(false);
  const [initialEmailCount, setInitialEmailCount] = useState(0);

  const lastSwipeTime = useRef(Date.now());
  const cardShownTime = useRef(Date.now());
  const comboTimer = useRef(null);
  const boostTimer = useRef(null);

  // Refresh gamification state from localStorage
  const refreshGamState = useCallback(() => {
    setGamState(getGamificationState());
  }, []);

  // --- Existing effects ---
  useEffect(() => { fetchEmails(); }, []);
  useEffect(() => { try { localStorage.setItem('swipebox_stats', JSON.stringify(stats)); } catch {} }, [stats]);
  useEffect(() => { try { localStorage.setItem('swipebox_history', JSON.stringify(history)); } catch {} }, [history]);
  useEffect(() => { if (lastAction) { setShowToast(true); const t = setTimeout(() => setShowToast(false), 2500); return () => clearTimeout(t); } }, [lastAction]);

  // --- Gamification init ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Check streak on load
    const { events } = checkAndUpdateStreak();
    refreshGamState();

    // Show streak frozen event
    for (const evt of events) {
      if (evt.type === "streak_broken") {
        // Could show a notification
      }
    }
  }, [refreshGamState]);

  // Start 3x boost on first email load
  useEffect(() => {
    if (emails.length > 0 && !boostEndTime && initialEmailCount === 0) {
      const endTime = Date.now() + 10 * 60 * 1000; // 10 minutes
      setBoostEndTime(endTime);
      setBoostActive(true);
      setInitialEmailCount(emails.length);
      boostTimer.current = setTimeout(() => {
        setBoostActive(false);
      }, 10 * 60 * 1000);
    }
    return () => { if (boostTimer.current) clearTimeout(boostTimer.current); };
  }, [emails.length, boostEndTime, initialEmailCount]);

  // Track card shown time for speed bonus
  useEffect(() => {
    if (emails.length > 0) {
      cardShownTime.current = Date.now();
    }
  }, [emails.length]);

  // Combo timeout
  useEffect(() => {
    if (comboCount > 0) {
      if (comboTimer.current) clearTimeout(comboTimer.current);
      comboTimer.current = setTimeout(() => {
        setComboCount(0);
      }, 10000); // 10 sec timeout
    }
    return () => { if (comboTimer.current) clearTimeout(comboTimer.current); };
  }, [comboCount]);

  // Check for 50% milestone
  useEffect(() => {
    if (halfwayTriggered || initialEmailCount === 0) return;
    const totalProcessed = stats.sent + stats.read + stats.snoozed + stats.unsubscribed;
    const halfwayPoint = Math.ceil(initialEmailCount / 2);
    if (totalProcessed >= halfwayPoint && totalProcessed > 0) {
      setHalfwayTriggered(true);
      // Award bonus
      const result = awardXP(100);
      addGems(5);
      refreshGamState();
      setCelebration({ type: "halfway", xp: 100, gems: 5 });
    }
  }, [stats, halfwayTriggered, initialEmailCount, refreshGamState]);

  // Check for inbox zero
  useEffect(() => {
    if (emails.length === 0 && initialEmailCount > 0 && !loading) {
      const currentGam = getGamificationState();
      addGems(10);
      refreshGamState();
      // Delay to not conflict with last swipe animation
      setTimeout(() => {
        setCelebration({
          type: "inbox_zero",
          stats: {
            total: initialEmailCount,
            xp: currentGam.dailyXP,
            streak: currentGam.currentStreak,
          },
        });
      }, 800);
    }
  }, [emails.length, initialEmailCount, loading, refreshGamState]);

  // Check for expired snoozes on load
  async function checkExpiredSnoozes() {
    const expired = clearExpiredSnoozes();
    if (expired.length > 0) {
      try {
        await fetch("/api/emails/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsnooze_batch", snoozeIds: expired }),
        });
      } catch (err) {
        console.error("Unsnooze failed:", err);
      }
    }
  }

  async function fetchEmails() {
    setLoading(true);
    setLoadingMessage("Fetching your emails...");
    setFetchError(null);
    try {
      await checkExpiredSnoozes();
      const res = await fetch("/api/emails");
      if (res.status === 401) { setIsAuthenticated(false); setLoading(false); return; }
      setIsAuthenticated(true);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setFetchError(errData.error || 'Failed to load emails. Please try again.');
        setLoading(false);
        return;
      }
      setLoadingMessage("AI is analyzing your emails...");
      const data = await res.json();
      setEmails(data.emails || []);
      setAccounts(data.accounts || []);
      setHistory([]);
      setStats({ sent: 0, read: 0, snoozed: 0, unsubscribed: 0 });
      setLoading(false);
    } catch (err) { console.error("Error:", err);
      setFetchError('Unable to connect to Gmail. Please try again.');
      setLoading(false);
    }
  }

  // --- Gamification XP award helper ---
  const awardSwipeXP = useCallback((actionType) => {
    const now = Date.now();
    const speedMs = now - cardShownTime.current;
    const newCombo = comboCount + 1;
    setComboCount(newCombo);
    lastSwipeTime.current = now;

    const boostMult = boostActive ? 3 : 1;
    const xpCalc = calculateXP({ actionType, speedMs, comboCount: newCombo, boostMultiplier: boostMult });
    const result = awardXP(xpCalc.total);

    setLastXPAwarded(xpCalc.total);
    refreshGamState();

    // Process events (level up, daily goal, streak milestone)
    for (const evt of result.events) {
      if (evt.type === "level_up") {
        setTimeout(() => setCelebration({ type: "level_up", newLevel: evt.newLevel }), 400);
      } else if (evt.type === "daily_goal_met") {
        setTimeout(() => setCelebration({ type: "daily_goal_met", streak: evt.streak, gems: evt.gems }), 400);
      } else if (evt.type === "streak_milestone") {
        setTimeout(() => setCelebration({ type: "streak_milestone", milestone: evt.milestone, gems: evt.gems }), 400);
      }
    }
  }, [comboCount, boostActive, refreshGamState]);

  const handleSwipe = useCallback(async (direction, replyText) => {
    if (emails.length === 0 || actionInProgress) return;
    setExpandedEmail(null);
    const current = emails[0];

    if (direction === "up") {
      setPendingSnoozeEmail(current);
      setShowSnoozePicker(true);
      return;
    }

    const actionMap = { right: "send", left: "mark_read", down: "unsubscribe" };
    const statMap = { right: "sent", left: "read", down: "unsubscribed" };

    const rightLabel = replyText ? `Reply sent to ${current.from}` : `Done: ${current.from}`;
    const labelMap = {
      right: rightLabel,
      left: `Marked read: ${current.from}`,
      down: `Unsubscribed: ${current.from}`,
    };

    setEmails((e) => e.slice(1));
    setHistory((h) => [...h, { email: current, direction }]);
    setStats((s) => ({ ...s, [statMap[direction]]: s[statMap[direction]] + 1 }));
    setLastAction({ direction, label: labelMap[direction] });

    // Award XP
    awardSwipeXP("swipe");

    setActionInProgress(true);
    try {
      if (direction === "down") {
        const unsubRes = await fetch("/api/emails/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: current.id, accountEmail: current.account }),
        });
        const unsubData = await unsubRes.json();
        const newSender = { email: current.email, name: current.from, date: new Date().toISOString() };
        setUnsubscribedSenders(prev => {
          const updated = [...prev.filter(s => s.email !== current.email), newSender];
          if (typeof window !== "undefined") {
            localStorage.setItem("swipebox_unsubscribed", JSON.stringify(updated));
            document.cookie = "swipebox_unsubscribed=" + btoa(JSON.stringify(updated)) + ";path=/;max-age=31536000";
          }
          return updated;
        });
        if (unsubData.method === "link" && unsubData.unsubscribeUrl) {
          setUnsubUrl(unsubData.unsubscribeUrl);
          setUnsubSender(current.from);
          setShowUnsubOverlay(true);
        }
      } else {
        await fetch("/api/emails/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: actionMap[direction],
            email: current,
            replyText: direction === "right" ? replyText : undefined,
          }),
        });
      }
    } catch (err) { console.error("Action failed:", err); }
    setActionInProgress(false);
  }, [emails, actionInProgress, awardSwipeXP]);

  const handleSnoozeSelect = useCallback(async (option) => {
    const email = pendingSnoozeEmail || emails[0];
    if (!email) return;

    setShowSnoozePicker(false);
    setPendingSnoozeEmail(null);
    setExpandedEmail(null);

    const snoozeUntil = getSnoozeTime(option);
    addSnoozedEmail(email.id, email.account, snoozeUntil);

    setEmails((e) => e.filter((em) => em.id !== email.id));
    setHistory((h) => [...h, { email, direction: "up" }]);
    setStats((s) => ({ ...s, snoozed: s.snoozed + 1 }));
    setLastAction({ direction: "up", label: `Snoozed: ${option.label}` });

    // Award XP for snooze
    awardSwipeXP("swipe");

    setActionInProgress(true);
    try {
      await fetch("/api/emails/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snooze", email }),
      });
    } catch (err) { console.error("Snooze failed:", err); }
    setActionInProgress(false);
  }, [pendingSnoozeEmail, emails, awardSwipeXP]);

  const handleForward = useCallback(async (toEmail) => {
    if (!expandedEmail || !toEmail) return;
    try {
      await fetch("/api/emails/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forward", email: expandedEmail, forwardTo: toEmail }),
      });
      setLastAction({ direction: "right", label: `Forwarded to ${toEmail}` });
    } catch (err) { console.error("Forward failed:", err); }
  }, [expandedEmail]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setEmails((e) => [last.email, ...e]);
    const statMap = { right: "sent", left: "read", up: "snoozed", down: "unsubscribed" };
    setStats((s) => ({ ...s, [statMap[last.direction]]: s[statMap[last.direction]] - 1 }));
    setShowToast(false);
  }, [history]);

  const handleRemoveAccount = useCallback(async (emailToRemove) => {
    try {
      await fetch("/api/auth/gmail/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToRemove }),
      });
      setAccounts((a) => a.filter((acc) => acc.email !== emailToRemove));
      setEmails((e) => e.filter((em) => em.account !== emailToRemove));
    } catch (err) { console.error("Remove failed:", err); }
  }, []);

  const actionColors = { right: "#10B981", left: "#D97706", up: "#4F46E5", down: "#7C3AED" };

  // Gamification derived values
  const levelInfo = getLevelInfo(gamState.totalXP);
  const goalConfig = DAILY_GOALS[gamState.dailyGoal] || DAILY_GOALS.regular;

  if (isAuthenticated === null || (isAuthenticated && loading)) {
    return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FFFFFF" }}><LoadingScreen message={loadingMessage} /></div>;
  }
  if (isAuthenticated === false) return <LoginScreen />;

  if (fetchError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center', background: '#FFFFFF', color: '#1A1A2E' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Connection Error</h2>
      <p style={{ color: '#6B7280', marginBottom: '1.5rem', maxWidth: '300px' }}>{fetchError}</p>
      <button onClick={() => { setFetchError(null); fetchEmails(); }} style={{ padding: '0.75rem 2rem', borderRadius: '2rem', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
        Try Again
      </button>
      <button onClick={() => { setFetchError(null); setIsAuthenticated(false); }} style={{ padding: '0.75rem 2rem', borderRadius: '2rem', background: 'transparent', color: '#6B7280', border: '1px solid rgba(0,0,0,0.1)', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem', marginTop: '0.75rem' }}>
        Reconnect Gmail
      </button>
    </div>
  );

  const totalProcessed = stats.sent + stats.read + stats.snoozed + stats.unsubscribed;
  const totalEmails = totalProcessed + emails.length;
  const progressPercent = totalEmails > 0 ? (totalProcessed / totalEmails) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>{"\u2709"}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#1A1A2E", letterSpacing: "-0.3px" }}>SwipeBox</div>
            {accounts.length > 0 && <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "1px" }}>{accounts.length} inbox{accounts.length > 1 ? "es" : ""} connected</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {emails.length > 0 && <div style={{ padding: "5px 14px", borderRadius: "20px", background: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)", fontSize: "13px", fontWeight: 700, color: "#6B7280" }}>{emails.length} left</div>}
          <button onClick={() => setShowSettings(true)} title="Settings" style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1.5px solid rgba(0,0,0,0.08)", background: "#F5F5F7", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: "16px", cursor: "pointer", lineHeight: 1 }}>{"\u2699"}</button>
        </div>
      </div>

      {/* Gamification Bar */}
      <GamificationBar
        streak={gamState.currentStreak}
        level={levelInfo.level}
        gems={gamState.gems}
        xpProgress={levelInfo.progress}
        dailyXP={gamState.dailyXP}
        dailyGoalXP={goalConfig.xp}
        onStreakTap={() => setShowStreakDetail(true)}
      />

      {/* XP Boost Banner */}
      <XPBoostBanner active={boostActive} multiplier={3} endTime={boostEndTime} />

      {/* Enhanced Progress Bar */}
      {totalEmails > 0 && (
        <div style={{ padding: "14px 20px", background: "#FAFAFA", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{progressPercent === 100 ? "\u{1F389}" : "\u26A1"}</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: progressPercent === 100 ? "#10B981" : "#4F46E5" }}>
                {emails.length > 0 ? "Swiping to Inbox Zero" : "Inbox Zero Achieved!"}
              </span>
            </div>
            <span style={{ fontSize: "15px", fontWeight: 800, color: progressPercent === 100 ? "#10B981" : "#1A1A2E" }}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div style={{ height: "8px", borderRadius: "4px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progressPercent}%`,
              background: progressPercent === 100 ? "linear-gradient(90deg, #10B981, #34d399)" : "linear-gradient(90deg, #4F46E5, #7C3AED, #A78BFA)",
              backgroundSize: "200% 100%",
              animation: progressPercent < 100 ? "shimmer 2s linear infinite" : "none",
              transition: "width 0.5s ease", borderRadius: "4px",
              boxShadow: `0 0 12px ${progressPercent === 100 ? "rgba(16,185,129,0.3)" : "rgba(79,70,229,0.25)"}`,
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
              {totalProcessed} of {totalEmails} emails processed
            </span>
            {emails.length > 0 && emails.length <= 5 && (
              <span style={{ fontSize: "12px", color: "#4F46E5", fontWeight: 600 }}>
                Almost there! {"\u{1F4AA}"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
        {emails.length > 0 ? (
          <>
            <div style={{ flex: 1, width: "100%", maxWidth: "500px", position: "relative", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {emails.slice(0, 2).reverse().map((email, i) => {
                const isTop = i === Math.min(emails.length, 2) - 1;
                return <EmailCard key={email.id} email={email} isTop={isTop} onSwipe={handleSwipe} onTap={(e) => setExpandedEmail(e)} style={{ top: isTop ? "0px" : "8px" }} />;
              })}

              {/* Combo Counter */}
              <ComboCounter combo={comboCount} lastXP={lastXPAwarded} />
            </div>

            {/* Swipe Hints + Customize (bottom) */}
            <div style={{ width: "100%", padding: "16px 24px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-around", width: "100%", maxWidth: "340px" }}>
                {[
                  { arrow: "\u2190", label: (AVAILABLE_ACTIONS.find(a => a.id === swipeMappings.left) || {}).label || "Read" },
                  { arrow: "\u2191", label: (AVAILABLE_ACTIONS.find(a => a.id === swipeMappings.up) || {}).label || "Snooze" },
                  { arrow: "\u2193", label: (AVAILABLE_ACTIONS.find(a => a.id === swipeMappings.down) || {}).label || "Unsub" },
                  { arrow: "\u2192", label: (AVAILABLE_ACTIONS.find(a => a.id === swipeMappings.right) || {}).label || "Done" },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "56px" }}>
                    <span style={{ fontSize: "18px", color: "#B0B5C0", fontWeight: 300, lineHeight: 1 }}>{item.arrow}</span>
                    <span style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", textAlign: "center", lineHeight: 1.2 }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowSwipeSettings(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "5px 12px", borderRadius: "20px",
                  background: "transparent", border: "1px solid rgba(0,0,0,0.06)",
                  color: "#B0B5C0", fontSize: "10px", fontWeight: 600,
                  cursor: "pointer", letterSpacing: "0.3px",
                }}
              >
                <span style={{ fontSize: "11px" }}>{"\u2699"}</span> Customize
              </button>
            </div>
          </>
        ) : (
          <CompletionScreen stats={stats} onRefresh={fetchEmails} />
        )}
      </div>

      {/* Expanded Email Modal */}
      {expandedEmail && !composeState && (
        <EmailModal
          email={expandedEmail}
          onClose={() => setExpandedEmail(null)}
          onReply={(em) => setComposeState({ email: em, mode: "reply" })}
          onForward={(em) => setComposeState({ email: em, mode: "forward" })}
        />
      )}

      {/* Compose Card (Reply / Forward) */}
      {composeState && (
        <ComposeCard
          email={composeState.email}
          mode={composeState.mode}
          onSend={async ({ mode, email: em, replyText, forwardTo: fwdTo }) => {
            try {
              if (mode === "reply") {
                await fetch("/api/emails/action", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "send", email: em, replyText }),
                });
                setLastAction({ direction: "right", label: `Reply sent to ${em.from}` });
                awardSwipeXP("reply");
              } else {
                await fetch("/api/emails/action", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "forward", email: em, forwardTo: fwdTo }),
                });
                setLastAction({ direction: "right", label: `Forwarded to ${fwdTo}` });
                awardSwipeXP("forward");
              }
            } catch (err) { console.error("Send failed:", err); }
          }}
          onClose={() => setComposeState(null)}
        />
      )}

      {/* Snooze Picker */}
      {showUnsubOverlay && unsubUrl && (
        <UnsubscribeOverlay
          url={unsubUrl}
          sender={unsubSender}
          onClose={() => { setShowUnsubOverlay(false); setUnsubUrl(null); }}
        />
      )}

      {showSnoozePicker && (
        <SnoozePicker
          onSelect={handleSnoozeSelect}
          onClose={() => { setShowSnoozePicker(false); setPendingSnoozeEmail(null); }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          accounts={accounts}
          onClose={() => setShowSettings(false)}
          onRemoveAccount={handleRemoveAccount}
        />
      )}

      {/* Swipe Settings Modal */}
      {showSwipeSettings && (
        <SwipeSettingsModal
          mappings={swipeMappings}
          onSave={(newMappings) => setSwipeMappings(newMappings)}
          onClose={() => setShowSwipeSettings(false)}
        />
      )}

      {/* Streak Detail */}
      {showStreakDetail && (
        <StreakDetail
          state={gamState}
          onClose={() => setShowStreakDetail(false)}
          onUpdate={() => { refreshGamState(); }}
        />
      )}

      {/* Celebration Overlay */}
      {celebration && (
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={() => { setCelebration(null); refreshGamState(); }}
        />
      )}

      {/* Toast */}
      {showToast && lastAction && (
        <div style={{ position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: "16px", background: "rgba(0,0,0,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)", color: "#1A1A2E", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 100, animation: "slideUp 0.3s ease", whiteSpace: "nowrap" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: actionColors[lastAction.direction], flexShrink: 0 }} />
          {lastAction.label}
          <button onClick={handleUndo} style={{ marginLeft: "8px", padding: "4px 14px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)", background: "transparent", color: "#1A1A2E", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Undo</button>
        </div>
      )}
    </div>
  );
}
