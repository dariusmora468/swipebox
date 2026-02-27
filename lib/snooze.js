function getSnoozeTime(option) {
  const now = new Date();
  if (option.hours) {
    return new Date(now.getTime() + option.hours * 60 * 60 * 1000).getTime();
  }
  if (option.tomorrow) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }
  if (option.weekend) {
    const d = new Date(now);
    const day = d.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSat);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }
  if (option.nextWeek) {
    const d = new Date(now);
    const day = d.getDay();
    const daysUntilMon = (1 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMon);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }
  return now.getTime() + 3 * 60 * 60 * 1000; // default 3 hours
}

function getSnoozedEmails() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("swipebox_snoozed") || "[]");
  } catch { return []; }
}

function addSnoozedEmail(emailId, account, snoozeUntil) {
  const snoozed = getSnoozedEmails();
  snoozed.push({ emailId, account, snoozeUntil });
  localStorage.setItem("swipebox_snoozed", JSON.stringify(snoozed));
}

function clearExpiredSnoozes() {
  const snoozed = getSnoozedEmails();
  const now = Date.now();
  const expired = snoozed.filter((s) => s.snoozeUntil <= now);
  const remaining = snoozed.filter((s) => s.snoozeUntil > now);
  localStorage.setItem("swipebox_snoozed", JSON.stringify(remaining));
  return expired;
}

export { getSnoozeTime, getSnoozedEmails, addSnoozedEmail, clearExpiredSnoozes };
