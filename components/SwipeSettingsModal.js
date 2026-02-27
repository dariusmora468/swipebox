'use client';
import { useState } from 'react';

const AVAILABLE_ACTIONS = [
  { id: 'mark_read', label: 'Mark Read', icon: '\u{1F4D6}', color: '#A0775A' },
  { id: 'snooze', label: 'Snooze', icon: '\u23F0', color: '#B8963E' },
  { id: 'unsubscribe', label: 'Unsubscribe', icon: '\u{1F6AB}', color: '#B07070' },
  { id: 'done', label: 'Done / Send', icon: '\u2713', color: '#7A8C6E' },
  { id: 'archive', label: 'Archive', icon: '\u{1F4E6}', color: '#6B5E54' },
  { id: 'delete', label: 'Delete', icon: '\u{1F5D1}\uFE0F', color: '#B07070' },
  { id: 'star', label: 'Star', icon: '\u2B50', color: '#B8963E' },
];

const DIRECTION_META = {
  left: { label: 'Swipe Left', arrow: '\u2190' },
  right: { label: 'Swipe Right', arrow: '\u2192' },
  up: { label: 'Swipe Up', arrow: '\u2191' },
  down: { label: 'Swipe Down', arrow: '\u2193' },
};

const DEFAULT_MAPPINGS = {
  left: 'mark_read',
  right: 'done',
  up: 'snooze',
  down: 'unsubscribe',
};

function getSwipeMappings() {
  if (typeof window === 'undefined') return DEFAULT_MAPPINGS;
  try {
    const saved = localStorage.getItem('swipebox_swipe_mappings');
    if (saved) return { ...DEFAULT_MAPPINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_MAPPINGS;
}

function saveSwipeMappings(mappings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('swipebox_swipe_mappings', JSON.stringify(mappings));
  }
}

function SwipeSettingsModal({ mappings, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...mappings });
  const [expandedDir, setExpandedDir] = useState(null);

  const handleSelect = (direction, actionId) => {
    setDraft(prev => ({ ...prev, [direction]: actionId }));
    setExpandedDir(null);
  };

  const handleSave = () => {
    saveSwipeMappings(draft);
    onSave(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_MAPPINGS });
  };

  const getAction = (actionId) => AVAILABLE_ACTIONS.find(a => a.id === actionId) || AVAILABLE_ACTIONS[0];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(44,37,32,0.3)', backdropFilter: 'blur(8px)',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '500px',
        background: '#FDFBF9', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 40px rgba(44,37,32,0.12)',
        padding: '0 0 env(safe-area-inset-bottom, 20px)',
        animation: 'slideUp 0.3s ease',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(120,100,80,0.12)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 24px 20px', borderBottom: '1px solid rgba(120,100,80,0.06)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '19px', fontWeight: 700, color: '#2C2520', margin: 0 }}>
            Customize Swipe Actions
          </h2>
          <p style={{ fontSize: '13px', color: '#9C8E82', margin: '6px 0 0', lineHeight: 1.5 }}>
            Choose what happens when you swipe in each direction
          </p>
        </div>

        {/* Direction mappings */}
        <div style={{ padding: '16px 24px' }}>
          {['left', 'right', 'up', 'down'].map((dir) => {
            const meta = DIRECTION_META[dir];
            const currentAction = getAction(draft[dir]);
            const isExpanded = expandedDir === dir;

            return (
              <div key={dir} style={{ marginBottom: '12px' }}>
                {/* Direction row */}
                <button
                  onClick={() => setExpandedDir(isExpanded ? null : dir)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '14px',
                    background: isExpanded ? 'rgba(160,119,90,0.04)' : 'rgba(120,100,80,0.03)',
                    border: isExpanded ? '1.5px solid rgba(160,119,90,0.15)' : '1px solid rgba(120,100,80,0.06)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `${currentAction.color}10`,
                      border: `1px solid ${currentAction.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: 700, color: currentAction.color,
                    }}>
                      {meta.arrow}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#2C2520' }}>{meta.label}</div>
                      <div style={{ fontSize: '12px', color: '#9C8E82', marginTop: '2px' }}>
                        {currentAction.icon} {currentAction.label}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px', color: '#B8A99A',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}>{"\u25BE"}</div>
                </button>

                {/* Action options dropdown */}
                {isExpanded && (
                  <div style={{
                    marginTop: '6px', padding: '8px',
                    background: 'rgba(120,100,80,0.02)', borderRadius: '14px',
                    border: '1px solid rgba(120,100,80,0.06)',
                  }}>
                    {AVAILABLE_ACTIONS.map((action) => {
                      const isSelected = draft[dir] === action.id;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleSelect(dir, action.id)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 12px', borderRadius: '10px',
                            background: isSelected ? `${action.color}08` : 'transparent',
                            border: isSelected ? `1px solid ${action.color}18` : '1px solid transparent',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                            marginBottom: '2px',
                          }}
                        >
                          <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{action.icon}</span>
                          <span style={{
                            fontSize: '14px', fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? action.color : '#4A433C',
                          }}>{action.label}</span>
                          {isSelected && (
                            <span style={{ marginLeft: 'auto', fontSize: '14px', color: action.color }}>{"\u2713"}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer buttons */}
        <div style={{
          padding: '12px 24px 24px', display: 'flex', gap: '10px',
          borderTop: '1px solid rgba(120,100,80,0.06)',
        }}>
          <button onClick={handleReset} style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            background: 'rgba(120,100,80,0.03)', border: '1px solid rgba(120,100,80,0.08)',
            color: '#6B5E54', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            Reset Defaults
          </button>
          <button onClick={handleSave} style={{
            flex: 2, padding: '14px', borderRadius: '14px',
            background: '#A0775A',
            border: 'none', color: '#FDFBF9', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(160,119,90,0.2)',
          }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export { AVAILABLE_ACTIONS, DEFAULT_MAPPINGS, getSwipeMappings, saveSwipeMappings };
export default SwipeSettingsModal;
