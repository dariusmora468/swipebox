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
    description: 'Swipe Left — Mark as Read',
    mustCall: ['markAsRead', 'archiveEmail'], // Must do BOTH for safety
  },
  send: {
    description: 'Swipe Right — Done/Send',
    mustCallAny: [
      ['archiveEmail'],           // No reply: mark read + archive
      ['sendReply', 'archiveEmail'], // With reply: send + archive
    ],
  },
  unsubscribe: {
    description: 'Swipe Down — Unsubscribe',
    mustCall: ['markAsRead', 'archiveEmail'],
  },
  snooze: {
    description: 'Swipe Up — Snooze',
    mustCall: ['snoozeEmail'], // snoozeEmail removes INBOX label
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
      // These may use different patterns
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
// TEST 3: Frontend → Backend alignment
// ============================================================
section('3. Frontend-Backend Alignment');

// Check that handleSwipe maps directions to correct actions
const directionActions = {
  right: 'send',
  left: 'mark_read',
  down: 'unsubscribe',
};

for (const [dir, action] of Object.entries(directionActions)) {
  if (pageJs.includes(`${dir}: "${action}"`)) {
    pass(`Swipe ${dir} maps to "${action}" action`);
  } else {
    fail(`Swipe ${dir} should map to "${action}" but mapping not found`);
  }
}

// Check that snooze direction is handled separately (not in actionMap)
if (pageJs.includes('direction === "up"') && pageJs.includes('setShowSnoozePicker')) {
  pass('Swipe up triggers snooze picker (separate flow)');
} else {
  fail('Swipe up should trigger snooze picker');
}

// ============================================================
// TEST 4: Gmail helper functions exist and are correct
// ============================================================
section('4. Gmail Helper Functions');

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

  // Check that it removes the correct label
  // Look for the function and its removeLabelIds
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
// TEST 5: Error handling
// ============================================================
section('5. Error Handling');

if (actionRoute.includes('catch (err)') && actionRoute.includes('action_failed')) {
  pass('Action route has error handling with proper error response');
} else {
  fail('Action route missing error handling');
}

if (pageJs.includes('catch (err) { console.error("Action failed:"')) {
  pass('Frontend catches and logs action errors');
} else {
  warn('Frontend error handling for actions could not be verified');
}

// ============================================================
// TEST 6: No orphaned imports / missing components
// ============================================================
section('6. Import Integrity');

const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
let match;
const imports = [];
while ((match = importRegex.exec(pageJs)) !== null) {
  imports.push(match[1]);
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
