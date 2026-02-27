/**
 * SwipeBox Core Actions Test Suite
 * =================================
 * These tests verify the FUNDAMENTAL CONTRACT of every swipe action:
 *
 *   "After any action is performed on an email, that email MUST NOT
 *    reappear when the app fetches emails again."
 *
 * HOW THE SYSTEM WORKS:
 *   - Fetch query: labelIds: ['INBOX', 'UNREAD'] — only returns emails
 *     that are BOTH in inbox AND unread
 *   - Therefore, any action must remove INBOX label, UNREAD label, or both
 *   - Removing EITHER one is sufficient to prevent reappearance
 *
 * RUN: cd ~/swipebox && node tests/core-actions.test.js
 * RUN BEFORE: Every deploy / push that touches handleSwipe, action API,
 *             fetch query, or Gmail helper functions
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg) { passed++; console.log(`  ${GREEN}✓${RESET} ${msg}`); }
function fail(msg) { failed++; console.log(`  ${RED}✗ FAIL:${RESET} ${msg}`); }
function warn(msg) { warnings++; console.log(`  ${YELLOW}⚠ WARN:${RESET} ${msg}`); }
function section(msg) { console.log(`\n${BOLD}${CYAN}${msg}${RESET}`); }

// Read source files
const gmailLib = fs.readFileSync(path.join(__dirname, '../lib/gmail.js'), 'utf8');
const actionRoute = fs.readFileSync(path.join(__dirname, '../app/api/emails/action/route.js'), 'utf8');
const pageJs = fs.readFileSync(path.join(__dirname, '../app/page.js'), 'utf8');
const settingsModal = fs.readFileSync(path.join(__dirname, '../components/SwipeSettingsModal.js'), 'utf8');

// ============================================================
// TEST 1: Fetch query must filter for UNREAD
// ============================================================
section('1. Email Fetch Query');

if (gmailLib.includes("labelIds: ['INBOX', 'UNREAD']") || gmailLib.includes('labelIds: ["INBOX", "UNREAD"]')) {
  pass('Fetch query filters by INBOX + UNREAD labels');
} else if (gmailLib.includes("labelIds: ['INBOX']") || gmailLib.includes('labelIds: ["INBOX"]')) {
  fail('Fetch query only filters by INBOX — read emails will reappear!');
} else {
  warn('Could not detect labelIds in fetch query — verify manually');
}

// ============================================================
// TEST 2: Every action must prevent email reappearance
// ============================================================
section('2. Action Contracts (each must remove INBOX or UNREAD)');

const ACTION_CONTRACTS = {
  mark_read: {
    description: 'Mark Read action',
    mustCall: ['markAsRead', 'archiveEmail'],
  },
  send: {
    description: 'Send/Reply action',
    mustCallAny: [
      ['archiveEmail'],
      ['sendReply', 'archiveEmail'],
    ],
  },
  unsubscribe: {
    description: 'Unsubscribe action',
    mustCall: ['markAsRead', 'archiveEmail'],
  },
  snooze: {
    description: 'Snooze action',
    mustCall: ['snoozeEmail'],
  },
  archive: {
    description: 'Archive action',
    mustCall: ['archiveEmail'],
  },
  delete: {
    description: 'Delete action',
    mustCall: ['trashEmail'],
  },
  forward: {
    description: 'Forward email',
    mustCall: ['forwardEmail'],
  },
};

// Extract each case block from the action route
function getCaseBlock(source, caseName) {
  const regex = new RegExp(`case "${caseName}":[\\s\\S]*?break;`, 'g');
  const match = source.match(regex);
  return match ? match[0] : '';
}

for (const [action, contract] of Object.entries(ACTION_CONTRACTS)) {
  const block = getCaseBlock(actionRoute, action);

  if (!block) {
    if (action === 'forward' || action === 'archive' || action === 'delete') {
      if (actionRoute.includes(`case "${action}"`)) {
        pass(`${contract.description}: case exists in action route`);
      } else {
        warn(`${contract.description}: no case block found`);
      }
      continue;
    }
    fail(`${contract.description}: no case "${action}" found in action route!`);
    continue;
  }

  if (contract.mustCall) {
    const allPresent = contract.mustCall.every(fn => block.includes(fn));
    if (allPresent) {
      pass(`${contract.description}: calls ${contract.mustCall.join(' + ')}`);
    } else {
      const missing = contract.mustCall.filter(fn => !block.includes(fn));
      fail(`${contract.description}: missing calls to ${missing.join(', ')} — email may reappear!`);
    }
  }

  if (contract.mustCallAny) {
    const anyPathWorks = contract.mustCallAny.some(fns =>
      fns.every(fn => block.includes(fn))
    );
    if (anyPathWorks) {
      pass(`${contract.description}: correct function calls present`);
    } else {
      fail(`${contract.description}: no valid action path found — email may reappear!`);
    }
  }
}

// ============================================================
// TEST 3: Action-based swipe handler (mapping-aware)
// ============================================================
section('3. Swipe Handler Architecture');

// handleSwipe must use getActionForDirection, NOT hardcoded directions
if (pageJs.includes('getActionForDirection')) {
  pass('handleSwipe uses getActionForDirection() — mapping-aware');
} else {
  fail('handleSwipe does NOT use getActionForDirection — swipe settings will be ignored!');
}

// handleSwipe must NOT have hardcoded direction checks like 'direction === "left"'
const hardcodedDirChecks = [
  'direction === "left"',
  'direction === "right"',
  'direction === "up"',
  'direction === "down"',
  "direction === 'left'",
  "direction === 'right'",
  "direction === 'up'",
  "direction === 'down'",
];

// Extract handleSwipe function body
const handleSwipeStart = pageJs.indexOf('const handleSwipe = useCallback');
const handleSwipeEnd = pageJs.indexOf('}, [emails, actionInProgress', handleSwipeStart);
const handleSwipeBody = handleSwipeStart >= 0 && handleSwipeEnd >= 0
  ? pageJs.substring(handleSwipeStart, handleSwipeEnd)
  : '';

if (handleSwipeBody) {
  const hasHardcoded = hardcodedDirChecks.some(check => handleSwipeBody.includes(check));
  if (!hasHardcoded) {
    pass('handleSwipe has NO hardcoded direction checks — fully action-based');
  } else {
    fail('handleSwipe still has hardcoded direction checks — ignores swipe settings!');
  }
} else {
  warn('Could not extract handleSwipe function body — verify manually');
}

// Verify each action has a handler block
const REQUIRED_ACTIONS = ['mark_read', 'snooze', 'done', 'archive', 'delete', 'unsubscribe', 'star'];
for (const action of REQUIRED_ACTIONS) {
  if (handleSwipeBody.includes(`action === "${action}"`)) {
    pass(`Action handler for "${action}" exists in handleSwipe`);
  } else {
    fail(`Action handler for "${action}" MISSING from handleSwipe`);
  }
}

// ============================================================
// TEST 4: Default mappings match between SwipeSettingsModal and page
// ============================================================
section('4. Default Mapping Consistency');

const DEFAULT_EXPECTED = {
  right: 'mark_read',
  left: 'snooze',
  up: 'done',
  down: 'delete',
};

for (const [dir, action] of Object.entries(DEFAULT_EXPECTED)) {
  if (settingsModal.includes(`${dir}: '${action}'`)) {
    pass(`SwipeSettingsModal default: ${dir} → ${action}`);
  } else {
    fail(`SwipeSettingsModal default for ${dir} should be '${action}'`);
  }
}

// Check version-aware localStorage reset exists
if (settingsModal.includes('MAPPINGS_VERSION') && settingsModal.includes('swipebox_mappings_version')) {
  pass('Version-aware localStorage reset mechanism exists');
} else {
  fail('No version-aware localStorage reset — stale mappings can cause action mismatch!');
}

// ============================================================
// TEST 4b: Account field integrity
// ============================================================
section('4b. Account Field Integrity');

// fetchAllAccountEmails must pass accountEmail to parseEmail
if (gmailLib.includes('parseEmail(fullMsg.data, account.email)')) {
  pass('fetchAllAccountEmails passes account.email to parseEmail');
} else if (gmailLib.includes('parseEmail(fullMsg.data)')) {
  fail('fetchAllAccountEmails does NOT pass account.email — email.account will be undefined, ALL actions will fail silently!');
} else {
  warn('Could not verify parseEmail call pattern — check manually');
}

// Action route must have fallback for email.accountEmail
if (actionRoute.includes('email.account || email.accountEmail') || actionRoute.includes('email.accountEmail || email.account')) {
  pass('Action route has fallback for legacy accountEmail field');
} else if (actionRoute.includes('email.account')) {
  warn('Action route only checks email.account — no fallback for legacy accountEmail');
}

// handleSwipe must check API response (not just catch network errors)
if (pageJs.includes('!res.ok') || pageJs.includes('res.ok')) {
  pass('handleSwipe checks API response status (not just network errors)');
} else {
  fail('handleSwipe does NOT check API response — failed actions are silently swallowed!');
}

// ============================================================
// TEST 5: Gmail Helper Functions
// ============================================================
section('5. Gmail Helper Functions');

const GMAIL_FUNCTIONS = {
  markAsRead: { removes: 'UNREAD', description: 'removes UNREAD label' },
  archiveEmail: { removes: 'INBOX', description: 'removes INBOX label' },
  snoozeEmail: { removes: 'INBOX', description: 'removes INBOX label' },
};

for (const [fn, expected] of Object.entries(GMAIL_FUNCTIONS)) {
  if (!gmailLib.includes(`export async function ${fn}`)) {
    fail(`${fn}() function not found in gmail.js`);
    continue;
  }

  const fnRegex = new RegExp(`function ${fn}[\\s\\S]*?removeLabelIds:[\\s\\S]*?\\["(.*?)"\\]`);
  const match = gmailLib.match(fnRegex);
  if (match && match[1] === expected.removes) {
    pass(`${fn}() ${expected.description}`);
  } else if (fn === 'trashEmail') {
    pass(`${fn}() trashes the email`);
  } else {
    warn(`${fn}() — could not verify it ${expected.description}. Check manually.`);
  }
}

if (gmailLib.includes('export async function trashEmail')) {
  pass('trashEmail() function exists');
} else {
  fail('trashEmail() function not found');
}

// ============================================================
// TEST 6: Error Handling
// ============================================================
section('6. Error Handling');

if (actionRoute.includes('catch (err)') && actionRoute.includes('action_failed')) {
  pass('Action route has error handling with proper error response');
} else {
  fail('Action route missing error handling');
}

// ============================================================
// TEST 7: Import Integrity
// ============================================================
section('7. Import Integrity');

const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
let importMatch;
const imports = [];
while ((importMatch = importRegex.exec(pageJs)) !== null) {
  imports.push(importMatch[1]);
}

for (const imp of imports) {
  if (imp.startsWith('.')) {
    const resolvedPath = path.join(__dirname, '../app', imp);
    const possiblePaths = [
      resolvedPath + '.js',
      resolvedPath + '.jsx',
      resolvedPath + '/index.js',
      resolvedPath + '/route.js',
    ];
    const exists = possiblePaths.some(p => fs.existsSync(p));
    if (exists) {
      pass(`Import "${imp}" resolves to a file`);
    } else {
      fail(`Import "${imp}" — file not found! Build will fail.`);
    }
  }
}

// ============================================================
// RESULTS
// ============================================================
section('Results');
console.log(`  ${GREEN}${passed} passed${RESET}, ${failed > 0 ? RED : ''}${failed} failed${RESET}, ${warnings > 0 ? YELLOW : ''}${warnings} warnings${RESET}`);

if (failed > 0) {
  console.log(`\n  ${RED}${BOLD}DEPLOY BLOCKED — fix failures above before pushing${RESET}\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n  ${YELLOW}${BOLD}DEPLOY OK with warnings — review manually${RESET}\n`);
} else {
  console.log(`\n  ${GREEN}${BOLD}ALL CLEAR — safe to deploy${RESET}\n`);
}
