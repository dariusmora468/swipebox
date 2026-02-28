'use client';
import { useState, useEffect, useCallback } from 'react';
import { getSnoozeTime, addSnoozedEmail, clearExpiredSnoozes } from '../lib/snooze';
import SnoozePicker from '../components/SnoozePicker';
import EmailModal from '../components/EmailModal';
import SettingsModal from '../components/SettingsModal';
import EmailCard from '../components/EmailCard';
import ActionButton from '../components/ActionButton';
import SwipeSettingsModal, { AVAILABLE_ACTIONS, getSwipeMappings } from '../components/SwipeSettingsModal';
import ComposeCard from '../components/ComposeCard';
import CompletionScreen from '../components/CompletionScreen';
import LoadingScreen from '../components/LoadingScreen';
import LoginScreen from '../components/LoginScreen';
import CelebrationOverlay from '../components/CelebrationOverlay';
import LandingPage from '../components/LandingPage';
import Onboarding from '../components/Onboarding';

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

  // Landing / onboarding flow state
  const [appView, setAppView] = useState(() => {
    if (typeof window === 'undefined') return 'loading';
    // If user has completed onboarding before, skip to app
    if (localStorage.getItem('swipebox_onboarded') === 'true') return 'app';
    // If user has a valid promo code, skip to app
    if (localStorage.getItem('swipebox_promo_validated') === 'true') return 'app';
    return 'landing';
  });

  // Celebration state
  const [celebration, setCelebration] = useState(null);
  const [halfwayTriggered, setHalfwayTriggered] = useState(false);
  const [initialEmailCount, setInitialEmailCount] = useState(0);

  useEffect(() => { fetchEmails(); }, []);

  useEffect(() => {
    try { localStorage.setItem('swipebox_stats', JSON.stringify(stats)); } catch {}
  }, [stats]);

  useEffect(() => {
    try { localStorage.setItem('swipebox_history', JSON.stringify(history)); } catch {}
  }, [history]);
  useEffect(() => { if (lastAction) { setShowToast(true); const t = setTimeout(() => setShowToast(false), 2500); return () => clearTimeout(t); } }, [lastAction]);

  // Check for 50% milestone
  useEffect(() => {
    if (halfwayTriggered || initialEmailCount === 0) return;
    const totalProcessed = stats.sent + stats.read + stats.snoozed + stats.unsubscribed;
    const halfwayPoint = Math.ceil(initialEmailCount / 2);
    if (totalProcessed >= halfwayPoint && totalProcessed > 0 && emails.length > 0) {
      setHalfwayTriggered(true);
      setCelebration({ type: "halfway" });
    }
  }, [stats, halfwayTriggered, initialEmailCount, emails.length]);

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
        const friendlyErrors = {
          'token_expired': 'Your Gmail session has expired. Please sign in again.',
          'fetch_failed': 'We couldn\u2019t reach Gmail right now. Please try again in a moment.',
          'account_not_found': 'We couldn\u2019t find your account. Please sign in again.',
          'not_authenticated': 'Please sign in to continue.',
        };
        setFetchError(friendlyErrors[errData.error] || 'Something went wrong loading your emails. Please try again.');
        setLoading(false);
        return;
      }
      setLoadingMessage("AI is analyzing your emails...");
      const data = await res.json();
      const emailList = data.emails || [];
      setEmails(emailList);
      setAccounts(data.accounts || []);
      setHistory([]);
      setStats({ sent: 0, read: 0, snoozed: 0, unsubscribed: 0 });
      setInitialEmailCount(emailList.length);
      setHalfwayTriggered(false);
      setLoading(false);
    } catch (err) { console.error("Error:", err);
      setFetchError('Unable to connect to Gmail. Please try again.');
      setLoading(false);
    }
  }

  // Resolve swipe direction → action using current mappings
  const getActionForDirection = useCallback((direction) => {
    return swipeMappings[direction] || "mark_read";
  }, [swipeMappings]);

  // Helper: call action API and verify it succeeded. Throws on failure.
  const callAction = async (actionName, email, extra = {}) => {
    const res = await fetch("/api/emails/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionName, email, ...extra }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.details || data.error || `Action ${actionName} failed (${res.status})`);
    }
    return res;
  };

  const handleSwipe = useCallback(async (direction, replyText) => {
    if (emails.length === 0) return;
    setExpandedEmail(null);
    const current = emails[0];
    const action = getActionForDirection(direction);

    // === SNOOZE: opens picker, doesn't remove email yet ===
    if (action === "snooze") {
      setPendingSnoozeEmail(current);
      setShowSnoozePicker(true);
      return;
    }

    // === REPLY / SEND (done): either auto-send AI draft or open compose ===
    if (action === "done") {
      if (current.aiReply) {
        // Optimistic: remove email immediately, rollback on failure
        setEmails((e) => e.slice(1));
        setHistory((h) => [...h, { email: current, direction, action }]);
        setStats((s) => ({ ...s, sent: s.sent + 1 }));
        setLastAction({ direction, label: `Reply sent to ${current.from}` });
        try {
          await callAction("send", current, { replyText: current.aiReply });
        } catch (err) {
          console.error("Reply failed, rolling back:", err);
          setEmails((e) => [current, ...e]);
          setHistory((h) => h.slice(0, -1));
          setStats((s) => ({ ...s, sent: s.sent - 1 }));
          setLastAction({ direction, label: `Failed — ${current.from}` });
        }
      } else {
        setComposeState({ email: current, mode: "reply" });
      }
      return;
    }

    // === MARK READ ===
    if (action === "mark_read") {
      setEmails((e) => e.slice(1));
      setHistory((h) => [...h, { email: current, direction, action }]);
      setStats((s) => ({ ...s, read: s.read + 1 }));
      setLastAction({ direction, label: `Marked read: ${current.from}` });
      try {
        await callAction("mark_read", current);
      } catch (err) {
        console.error("Mark read failed, rolling back:", err);
        setEmails((e) => [current, ...e]);
        setHistory((h) => h.slice(0, -1));
        setStats((s) => ({ ...s, read: s.read - 1 }));
        setLastAction({ direction, label: `Failed — ${current.from}` });
      }
      return;
    }

    // === ARCHIVE ===
    if (action === "archive") {
      setEmails((e) => e.slice(1));
      setHistory((h) => [...h, { email: current, direction, action }]);
      setStats((s) => ({ ...s, read: s.read + 1 }));
      setLastAction({ direction, label: `Archived: ${current.from}` });
      try {
        await callAction("archive", current);
      } catch (err) {
        console.error("Archive failed, rolling back:", err);
        setEmails((e) => [current, ...e]);
        setHistory((h) => h.slice(0, -1));
        setStats((s) => ({ ...s, read: s.read - 1 }));
        setLastAction({ direction, label: `Failed — ${current.from}` });
      }
      return;
    }

    // === DELETE (unsub + delete combo) ===
    if (action === "delete") {
      // Optimistic: remove email immediately
      setEmails((e) => e.slice(1));
      setHistory((h) => [...h, { email: current, direction, action }]);
      setStats((s) => ({ ...s, unsubscribed: s.unsubscribed + 1 }));
      setLastAction({ direction, label: `Unsub + deleted: ${current.from}` });
      try {
        // Step 1: Try to unsubscribe (best-effort, don't block on failure)
        try {
          const unsubRes = await fetch("/api/emails/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: current.id, accountEmail: current.account }),
          });
          if (unsubRes.ok) {
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
              // Open the unsubscribe page in a new tab so the user can complete it
              window.open(unsubData.unsubscribeUrl, "_blank");
            }
          }
        } catch (unsubErr) { console.error("Unsub step failed (continuing to delete):", unsubErr); }
        // Step 2: Always trash the email — this is the critical part
        await callAction("delete", current);
      } catch (err) {
        console.error("Delete failed, rolling back:", err);
        setEmails((e) => [current, ...e]);
        setHistory((h) => h.slice(0, -1));
        setStats((s) => ({ ...s, unsubscribed: s.unsubscribed - 1 }));
        setLastAction({ direction, label: `Failed — ${current.from}` });
      }
      return;
    }

    // === UNSUBSCRIBE (standalone — kept for custom mappings) ===
    if (action === "unsubscribe") {
      setEmails((e) => e.slice(1));
      setHistory((h) => [...h, { email: current, direction, action }]);
      setStats((s) => ({ ...s, unsubscribed: s.unsubscribed + 1 }));
      setLastAction({ direction, label: `Unsubscribed: ${current.from}` });
      try {
        const unsubRes = await fetch("/api/emails/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: current.id, accountEmail: current.account }),
        });
        if (unsubRes.ok) {
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
            // Open the unsubscribe page in a new tab so the user can complete it
            window.open(unsubData.unsubscribeUrl, "_blank");
          }
        }
        await callAction("unsubscribe", current);
      } catch (err) {
        console.error("Unsubscribe failed, rolling back:", err);
        setEmails((e) => [current, ...e]);
        setHistory((h) => h.slice(0, -1));
        setStats((s) => ({ ...s, unsubscribed: s.unsubscribed - 1 }));
        setLastAction({ direction, label: `Failed — ${current.from}` });
      }
      return;
    }

    // === STAR (future) ===
    if (action === "star") {
      setEmails((e) => e.slice(1));
      setHistory((h) => [...h, { email: current, direction, action }]);
      setStats((s) => ({ ...s, read: s.read + 1 }));
      setLastAction({ direction, label: `Starred: ${current.from}` });
      try {
        await callAction("star", current);
      } catch (err) {
        console.error("Star failed, rolling back:", err);
        setEmails((e) => [current, ...e]);
        setHistory((h) => h.slice(0, -1));
        setStats((s) => ({ ...s, read: s.read - 1 }));
        setLastAction({ direction, label: `Failed — ${current.from}` });
      }
      return;
    }
  }, [emails, getActionForDirection]);

  const handleSnoozeSelect = useCallback(async (option) => {
    const email = pendingSnoozeEmail || emails[0];
    if (!email) return;

    setShowSnoozePicker(false);
    setPendingSnoozeEmail(null);
    setExpandedEmail(null);

    const snoozeUntil = getSnoozeTime(option);
    addSnoozedEmail(email.id, email.account, snoozeUntil);

    setEmails((e) => e.filter((em) => em.id !== email.id));
    setHistory((h) => [...h, { email, direction: "up", action: "snooze" }]);
    setStats((s) => ({ ...s, snoozed: s.snoozed + 1 }));
    setLastAction({ direction: "up", label: `Snoozed: ${option.label}` });

    try {
      await callAction("snooze", email);
    } catch (err) {
      console.error("Snooze failed, rolling back:", err);
      setEmails((e) => [email, ...e]);
      setHistory((h) => h.slice(0, -1));
      setStats((s) => ({ ...s, snoozed: s.snoozed - 1 }));
      setLastAction({ direction: "up", label: `Failed — ${email.from}` });
    }
  }, [pendingSnoozeEmail, emails]);

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

  const handleUndo = useCallback(async () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];

    // Optimistic: restore email to list immediately
    setHistory((h) => h.slice(0, -1));
    setEmails((e) => [last.email, ...e]);
    const statKey = last.action === "done" || last.action === "send" ? "sent"
      : last.action === "delete" || last.action === "unsubscribe" ? "unsubscribed"
      : last.action === "snooze" || last.action === "snoozed" ? "snoozed"
      : "read";
    setStats((s) => ({ ...s, [statKey]: Math.max(0, s[statKey] - 1) }));
    setLastAction({ direction: last.direction, label: `Undo: ${last.email.from}` });

    // Call API to reverse the Gmail action
    try {
      await callAction("undo", { ...last.email, originalAction: last.action });
    } catch (err) {
      console.error("Undo API failed:", err);
      // Don't rollback the UI undo — the email is back in the list which is better UX
      // The user can re-swipe if needed
    }
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

  const actionColors = { right: "#A0775A", left: "#B8963E", up: "#7A8C6E", down: "#B07070" };

  if (isAuthenticated === null || (isAuthenticated && loading)) {
    return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F5F0EB" }}><LoadingScreen message={loadingMessage} /></div>;
  }

  // Landing page for first-time, unauthenticated users
  if (isAuthenticated === false && appView === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setAppView('onboarding')}
        onHaveInvite={() => {
          // Promo validated — mark onboarded and go to Gmail connect
          if (typeof window !== 'undefined') localStorage.setItem('swipebox_onboarded', 'true');
          setAppView('app');
        }}
      />
    );
  }

  // Interactive onboarding demo
  if (isAuthenticated === false && appView === 'onboarding') {
    return (
      <Onboarding
        onComplete={() => {
          if (typeof window !== 'undefined') localStorage.setItem('swipebox_onboarded', 'true');
          setAppView('app');
        }}
      />
    );
  }

  // Gmail connect screen (after onboarding or returning users)
  if (isAuthenticated === false) return <LoginScreen />;

  if (fetchError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center', background: '#F5F0EB', color: '#2C2520' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{"\u26A0\uFE0F"}</div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: "'Playfair Display', Georgia, serif" }}>Connection Error</h2>
      <p style={{ color: '#6B5E54', marginBottom: '1.5rem', maxWidth: '300px' }}>{fetchError}</p>
      <button onClick={() => { setFetchError(null); fetchEmails(); }} style={{ padding: '0.75rem 2rem', borderRadius: '2rem', background: '#A0775A', color: '#FDFBF9', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
        Try Again
      </button>
      <button onClick={() => { setFetchError(null); setIsAuthenticated(false); }} style={{ padding: '0.75rem 2rem', borderRadius: '2rem', background: 'transparent', color: '#6B5E54', border: '1px solid rgba(120,100,80,0.14)', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem', marginTop: '0.75rem' }}>
        Reconnect Gmail
      </button>
    </div>
  );

  const totalProcessed = stats.sent + stats.read + stats.snoozed + stats.unsubscribed;
  const totalEmails = initialEmailCount > 0 ? initialEmailCount : emails.length;
  const progressPercent = totalEmails > 0 ? Math.min((totalProcessed / totalEmails) * 100, 100) : 0;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F5F0EB" }}>
      {/* Header — Editorial style */}
      <div style={{
        padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(120,100,80,0.08)",
        background: "rgba(245,240,235,0.92)", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700, fontSize: "22px", color: "#2C2520",
            letterSpacing: "1.5px", textTransform: "uppercase",
          }}>SwipeBox</div>
          {accounts.length > 0 && (
            <div style={{ fontSize: "11px", color: "#9C8E82", marginTop: "2px", letterSpacing: "0.3px" }}>
              {accounts.length} inbox{accounts.length > 1 ? "es" : ""} connected
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {emails.length > 0 && (
            <div style={{
              padding: "5px 14px", borderRadius: "20px",
              background: "rgba(160,119,90,0.08)", border: "1px solid rgba(160,119,90,0.12)",
              fontSize: "13px", fontWeight: 600, color: "#A0775A",
            }}>{emails.length} left</div>
          )}
          <button onClick={() => setShowSettings(true)} title="Settings" style={{
            width: "34px", height: "34px", borderRadius: "50%",
            border: "1px solid rgba(120,100,80,0.1)", background: "rgba(120,100,80,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#9C8E82", fontSize: "16px", cursor: "pointer", lineHeight: 1,
          }}>{"\u2699"}</button>
        </div>
      </div>

      {/* Progress Bar — Warm editorial tones */}
      {totalEmails > 0 && (
        <div style={{
          padding: "16px 24px 16px",
          background: "rgba(237,232,226,0.5)",
          borderBottom: "1px solid rgba(120,100,80,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{
              fontSize: "13px", fontWeight: 500,
              color: progressPercent === 100 ? "#7A8C6E" : "#6B5E54",
              letterSpacing: "0.2px",
            }}>
              {emails.length > 0 ? "Swiping to Inbox Zero" : "Inbox Zero Achieved"}
            </span>
            <span style={{
              fontSize: "15px", fontWeight: 700,
              color: progressPercent === 100 ? "#7A8C6E" : "#2C2520",
            }}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div style={{ height: "6px", borderRadius: "3px", background: "rgba(120,100,80,0.08)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progressPercent}%`,
              background: progressPercent === 100
                ? "linear-gradient(90deg, #7A8C6E, #93A785)"
                : "linear-gradient(90deg, #A0775A, #C4845C, #B8963E)",
              backgroundSize: "200% 100%",
              animation: progressPercent < 100 ? "shimmer 3s ease infinite" : "none",
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)", borderRadius: "3px",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ fontSize: "11px", color: "#9C8E82", fontWeight: 500 }}>
              {totalProcessed} of {totalEmails} emails processed
            </span>
            {emails.length > 0 && emails.length <= 5 && (
              <span style={{ fontSize: "11px", color: "#A0775A", fontWeight: 600 }}>
                Almost there
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
                return <EmailCard key={email.id} email={email} isTop={isTop} onSwipe={handleSwipe} onTap={(e) => setExpandedEmail(e)} style={{ top: isTop ? "16px" : "24px" }} />;
              })}
            </div>

            {/* Undo Button */}
            {history.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", padding: "0 24px 8px" }}>
                <button
                  onClick={handleUndo}
                  style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    background: "#FDFBF9",
                    border: "1.5px solid rgba(120,100,80,0.12)",
                    boxShadow: "0 2px 12px rgba(60,45,30,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    flexDirection: "column", gap: "2px",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(60,45,30,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(60,45,30,0.08)"; }}
                  title="Undo last action"
                >
                  <span style={{ fontSize: "20px", lineHeight: 1, color: "#A0775A" }}>{"\u21A9"}</span>
                  <span style={{
                    fontSize: "8px", fontWeight: 600, color: "#9C8E82",
                    letterSpacing: "0.5px", textTransform: "uppercase",
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}>Undo</span>
                </button>
              </div>
            )}

            {/* Swipe Hints — Refined serif labels */}
            <div style={{ width: "100%", padding: "12px 24px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-around", width: "100%", maxWidth: "320px" }}>
                {[
                  { arrow: "\u2190", label: (AVAILABLE_ACTIONS.find(a => a.id === swipeMappings.left) || {}).label || "Snooze" },
                  { arrow: "\u2191", label: (AVAILABLE_ACTIONS.find(a => a.id === swipeMappings.up) || {}).label || "Reply" },
                  { arrow: "\u2193", label: (AVAILABLE_ACTIONS.find(a => a.id === swipeMappings.down) || {}).label || "Unsub / Delete" },
                  { arrow: "\u2192", label: (AVAILABLE_ACTIONS.find(a => a.id === swipeMappings.right) || {}).label || "Read" },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", minWidth: "56px" }}>
                    <span style={{ fontSize: "16px", color: "#B8A99A", fontWeight: 300, lineHeight: 1 }}>{item.arrow}</span>
                    <span style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "10px", color: "#9C8E82", fontWeight: 500,
                      letterSpacing: "0.8px", textTransform: "uppercase",
                      textAlign: "center", lineHeight: 1.2,
                    }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowSwipeSettings(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "4px 12px", borderRadius: "16px",
                  background: "transparent", border: "1px solid rgba(120,100,80,0.08)",
                  color: "#B8A99A", fontSize: "10px", fontWeight: 500,
                  cursor: "pointer", letterSpacing: "0.3px",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                Customize
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
              } else {
                await fetch("/api/emails/action", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "forward", email: em, forwardTo: fwdTo }),
                });
                setLastAction({ direction: "right", label: `Forwarded to ${fwdTo}` });
              }
            } catch (err) { console.error("Send failed:", err); }
          }}
          onClose={() => setComposeState(null)}
        />
      )}

      {/* Snooze Picker */}
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
          onSignOut={async () => {
            try {
              await fetch('/api/auth/signout', { method: 'POST' });
            } catch {}
            // Clear onboarding flag so landing page shows
            if (typeof window !== 'undefined') {
              localStorage.removeItem('swipebox_onboarded');
              localStorage.removeItem('swipebox_promo_validated');
              localStorage.removeItem('swipebox_promo_code');
            }
            setShowSettings(false);
            setIsAuthenticated(false);
            setAppView('landing');
            setEmails([]);
            setAccounts([]);
          }}
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

      {/* Halfway Celebration */}
      {celebration && (
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={() => setCelebration(null)}
        />
      )}

      {/* Toast — Warm editorial style */}
      {showToast && lastAction && (
        <div style={{
          position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)",
          padding: "12px 22px", borderRadius: "14px",
          background: "rgba(253,251,249,0.95)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(120,100,80,0.1)", color: "#2C2520",
          fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 4px 24px rgba(60,45,30,0.12)", zIndex: 100,
          animation: "slideUp 0.3s ease", whiteSpace: "nowrap",
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: actionColors[lastAction.direction], flexShrink: 0 }} />
          {lastAction.label}
          <button onClick={handleUndo} style={{
            marginLeft: "8px", padding: "4px 14px", borderRadius: "10px",
            border: "1px solid rgba(120,100,80,0.1)", background: "transparent",
            color: "#A0775A", fontSize: "12px", fontWeight: 600, cursor: "pointer",
          }}>Undo</button>
        </div>
      )}
    </div>
  );
}
