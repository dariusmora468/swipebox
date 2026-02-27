// Action icons and snooze options configuration
// --- Smart Action Icons ---
const ACTION_ICONS = {
  add_calendar: "\u{1F4C5}",
  set_reminder: "\u23F0",
  save_link: "\u{1F517}",
  track_package: "\u{1F4E6}",
  save_contact: "\u{1F464}",
  follow_up: "\u{1F504}",
};

// --- Snooze Options ---
const SNOOZE_OPTIONS = [
  { label: "Later Today", sublabel: "3 hours", hours: 3 },
  { label: "Tomorrow Morning", sublabel: "9:00 AM", hours: null, tomorrow: true },
  { label: "This Weekend", sublabel: "Saturday 9 AM", hours: null, weekend: true },
  { label: "Next Week", sublabel: "Monday 9 AM", hours: null, nextWeek: true },
];

export { ACTION_ICONS, SNOOZE_OPTIONS };
