// SwipeBox Gamification Engine
// Pure JS module — no React dependencies for easy future migration to server-side

const STORAGE_PREFIX = "swipebox_gamification_";

const DAILY_GOALS = {
  casual: { emails: 5, xp: 50, label: "Casual" },
  regular: { emails: 15, xp: 150, label: "Regular" },
  serious: { emails: 30, xp: 300, label: "Serious" },
  insane: { emails: 50, xp: 500, label: "Insane" },
};

// Exponential level curve: each level needs more XP
const LEVEL_THRESHOLDS = [];
(function buildLevels() {
  let xp = 0;
  for (let i = 1; i <= 50; i++) {
    LEVEL_THRESHOLDS.push({ level: i, xpRequired: Math.floor(xp) });
    if (i <= 5) xp += 100;
    else if (i <= 15) xp += 200;
    else if (i <= 30) xp += 400;
    else xp += 800;
  }
})();

const STREAK_MILESTONES = [7, 30, 100, 365];
const STREAK_GEM_REWARDS = { 7: 5, 30: 10, 100: 25, 365: 50 };

function getToday() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

// --- Storage helpers ---
function _get(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function _set(key, value) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch {}
}

// --- State accessors ---
function getState() {
  const today = getToday();
  const savedDate = _get("lastDate", "");

  // Auto-reset daily counters if day changed
  let dailyXP = _get("dailyXP", 0);
  let dailyGoalMet = _get("dailyGoalMet", false);
  let dailyEmailCount = _get("dailyEmailCount", 0);
  if (savedDate !== today) {
    dailyXP = 0;
    dailyGoalMet = false;
    dailyEmailCount = 0;
    _set("dailyXP", 0);
    _set("dailyGoalMet", false);
    _set("dailyEmailCount", 0);
    _set("lastDate", today);
  }

  // Auto-reset weekly counters if week changed
  const weekStart = getWeekStart();
  const savedWeekStart = _get("weekStart", "");
  let weeklyXP = _get("weeklyXP", 0);
  if (savedWeekStart !== weekStart) {
    weeklyXP = 0;
    _set("weeklyXP", 0);
    _set("weekStart", weekStart);
  }

  return {
    totalXP: _get("totalXP", 0),
    dailyXP,
    weeklyXP,
    gems: _get("gems", 0),
    currentStreak: _get("currentStreak", 0),
    longestStreak: _get("longestStreak", 0),
    lastActiveDate: _get("lastActiveDate", ""),
    streakFreezes: _get("streakFreezes", 0),
    streakFrozenDates: _get("streakFrozenDates", []),
    dailyGoal: _get("dailyGoal", "regular"),
    dailyGoalMet,
    dailyEmailCount,
    activeDays: _get("activeDays", []), // last 30 days tracking
    claimedStreakMilestones: _get("claimedStreakMilestones", []),
  };
}

// --- Level calculation ---
function getLevelInfo(totalXP) {
  let level = 1;
  let xpForCurrent = 0;
  let xpForNext = LEVEL_THRESHOLDS[1]?.xpRequired || 100;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xpRequired) {
      level = LEVEL_THRESHOLDS[i].level;
      xpForCurrent = LEVEL_THRESHOLDS[i].xpRequired;
      xpForNext = LEVEL_THRESHOLDS[i + 1]?.xpRequired || xpForCurrent + 1000;
      break;
    }
  }

  return {
    level,
    xpForCurrent,
    xpForNext,
    xpInLevel: totalXP - xpForCurrent,
    xpNeeded: xpForNext - xpForCurrent,
    progress: Math.min(1, (totalXP - xpForCurrent) / (xpForNext - xpForCurrent)),
  };
}

// --- Streak logic ---
function checkAndUpdateStreak() {
  const state = getState();
  const today = getToday();
  const yesterday = getYesterday();
  const events = [];

  // If already active today, no change
  if (state.lastActiveDate === today) return { state, events };

  // If active yesterday, streak continues (will be incremented when goal met)
  if (state.lastActiveDate === yesterday) return { state, events };

  // If missed yesterday, try using a freeze
  if (state.lastActiveDate && state.lastActiveDate < yesterday) {
    if (state.streakFreezes > 0) {
      const newFreezes = state.streakFreezes - 1;
      const newFrozenDates = [...state.streakFrozenDates, yesterday].slice(-30);
      _set("streakFreezes", newFreezes);
      _set("streakFrozenDates", newFrozenDates);
      state.streakFreezes = newFreezes;
      state.streakFrozenDates = newFrozenDates;
      events.push({ type: "streak_frozen", date: yesterday });
    } else if (state.currentStreak > 0) {
      // Streak broken
      _set("currentStreak", 0);
      state.currentStreak = 0;
      events.push({ type: "streak_broken" });
    }
  }

  return { state, events };
}

function recordDailyGoalMet() {
  const state = getState();
  const today = getToday();
  const yesterday = getYesterday();
  const events = [];

  if (state.dailyGoalMet) return { state, events }; // Already met today

  _set("dailyGoalMet", true);
  state.dailyGoalMet = true;

  // Update streak
  let newStreak = state.currentStreak;
  if (state.lastActiveDate === yesterday || state.lastActiveDate === today) {
    newStreak = state.currentStreak + 1;
  } else if (!state.lastActiveDate) {
    newStreak = 1; // First ever
  } else {
    // Gap — freeze may have handled it, but streak only increments by 1
    newStreak = state.currentStreak + 1;
  }

  _set("currentStreak", newStreak);
  _set("lastActiveDate", today);
  state.currentStreak = newStreak;
  state.lastActiveDate = today;

  if (newStreak > state.longestStreak) {
    _set("longestStreak", newStreak);
    state.longestStreak = newStreak;
  }

  // Track active days (last 30)
  const activeDays = [...state.activeDays.filter(d => d !== today), today].slice(-30);
  _set("activeDays", activeDays);
  state.activeDays = activeDays;

  // Award gems for daily goal
  addGems(2);
  state.gems += 2;
  events.push({ type: "daily_goal_met", streak: newStreak, gems: 2 });

  // Check streak milestones
  for (const milestone of STREAK_MILESTONES) {
    if (newStreak >= milestone && !state.claimedStreakMilestones.includes(milestone)) {
      const gems = STREAK_GEM_REWARDS[milestone] || 5;
      addGems(gems);
      state.gems += gems;
      const claimed = [...state.claimedStreakMilestones, milestone];
      _set("claimedStreakMilestones", claimed);
      state.claimedStreakMilestones = claimed;
      events.push({ type: "streak_milestone", milestone, gems });
    }
  }

  return { state, events };
}

// --- XP logic ---
function awardXP(amount) {
  const state = getState();
  const newTotal = state.totalXP + amount;
  const newDaily = state.dailyXP + amount;
  const newWeekly = state.weeklyXP + amount;
  const newEmailCount = state.dailyEmailCount + 1;

  const oldLevel = getLevelInfo(state.totalXP);
  const newLevel = getLevelInfo(newTotal);

  _set("totalXP", newTotal);
  _set("dailyXP", newDaily);
  _set("weeklyXP", newWeekly);
  _set("dailyEmailCount", newEmailCount);

  const events = [];

  // Level up?
  if (newLevel.level > oldLevel.level) {
    events.push({ type: "level_up", oldLevel: oldLevel.level, newLevel: newLevel.level });
  }

  // Daily goal met?
  const goalConfig = DAILY_GOALS[state.dailyGoal] || DAILY_GOALS.regular;
  if (!state.dailyGoalMet && newDaily >= goalConfig.xp) {
    const goalEvents = recordDailyGoalMet();
    events.push(...goalEvents.events);
  }

  return {
    xpAwarded: amount,
    totalXP: newTotal,
    dailyXP: newDaily,
    weeklyXP: newWeekly,
    dailyEmailCount: newEmailCount,
    level: newLevel,
    events,
  };
}

function calculateXP({ actionType, speedMs, comboCount, boostMultiplier }) {
  // Base XP
  let base = 10;
  if (actionType === "reply") base = 25;
  else if (actionType === "forward") base = 15;

  // Speed bonus (within 3 seconds)
  let speedBonus = 0;
  if (speedMs && speedMs < 3000) speedBonus = 5;

  // Combo multiplier
  let comboMult = 1;
  if (comboCount >= 20) comboMult = 3;
  else if (comboCount >= 10) comboMult = 2;
  else if (comboCount >= 5) comboMult = 1.5;

  // Session boost
  const boost = boostMultiplier || 1;

  const total = Math.floor((base + speedBonus) * comboMult * boost);
  return { base, speedBonus, comboMult, boost, total };
}

// --- Gems ---
function addGems(amount) {
  const current = _get("gems", 0);
  _set("gems", current + amount);
}

function spendGems(amount) {
  const current = _get("gems", 0);
  if (current < amount) return false;
  _set("gems", current - amount);
  return true;
}

function purchaseStreakFreeze() {
  const cost = 20;
  const freezes = _get("streakFreezes", 0);
  if (freezes >= 2) return { success: false, reason: "max_freezes" };
  if (!spendGems(cost)) return { success: false, reason: "not_enough_gems" };
  _set("streakFreezes", freezes + 1);
  return { success: true, newFreezes: freezes + 1 };
}

function purchaseXPBoost() {
  const cost = 15;
  if (!spendGems(cost)) return { success: false, reason: "not_enough_gems" };
  return { success: true };
}

// --- Daily goal ---
function setDailyGoal(goal) {
  if (!DAILY_GOALS[goal]) return;
  _set("dailyGoal", goal);
}

// --- 30-day calendar ---
function getStreakCalendar() {
  const state = getState();
  const calendar = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    let status = "missed";
    if (state.activeDays.includes(dateStr)) status = "active";
    else if (state.streakFrozenDates.includes(dateStr)) status = "frozen";
    if (dateStr === getToday() && !state.activeDays.includes(dateStr)) status = "today";
    calendar.push({ date: dateStr, status, day: d.getDate(), weekday: d.toLocaleDateString("en", { weekday: "short" }).charAt(0) });
  }
  return calendar;
}

export {
  DAILY_GOALS,
  LEVEL_THRESHOLDS,
  STREAK_MILESTONES,
  STREAK_GEM_REWARDS,
  getState,
  getLevelInfo,
  checkAndUpdateStreak,
  recordDailyGoalMet,
  awardXP,
  calculateXP,
  addGems,
  spendGems,
  purchaseStreakFreeze,
  purchaseXPBoost,
  setDailyGoal,
  getStreakCalendar,
  getToday,
};
