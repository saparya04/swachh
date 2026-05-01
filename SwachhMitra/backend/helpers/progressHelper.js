// ─────────────────────────────────────────────────────────────────────────────
//  helpers/progressHelper.js
//  Central place for XP values, badge definitions, and award logic.
// ─────────────────────────────────────────────────────────────────────────────

const XP = {
  JOIN_EVENT:      80,
  ATTEND_EVENT:   150,   // extra when organiser marks attendance
  SCAN_ITEM:        2,
  EARN_BADGE:     100,
  REFERRAL:        50,
  /** Rewards tab: inside active cleanup geofence for a joined event (max once/day IST). */
  GEOFENCE_REWARDS_BONUS: 10,
  /** Rewards tab: Final AI bag classifier reported >60% (claim once flagged). */
  FINAL_AI_BAG_BONUS:    50,
};

// Certificate definitions  ── must mirror what the frontend renders ──────────
const CERT_DEFS = [
  {
    certId: 'eco_warrior',
    title:  'Eco Warrior',
    emoji:  '🌿',
    desc:   'Attended 5 cleanup drives',
    metric: 'totalEventsJoined',
    max:    5,
    badgeId:'eco_warrior',
  },
  {
    certId: 'water_guardian',
    title:  'Water Guardian',
    emoji:  '💧',
    desc:   'Joined 2 river cleanup events',
    metric: 'totalEventsJoined',    // simplified: same metric, different max
    max:    2,
    badgeId:'water_guardian',
  },
  {
    certId: 'zero_waste_hero',
    title:  'Zero Waste Hero',
    emoji:  '♻️',
    desc:   'Classified 50 waste items',
    metric: 'totalScans',
    max:    50,
    badgeId:'zero_waste_hero',
  },
  {
    certId: 'community_champion',
    title:  'Community Champion',
    emoji:  '🤝',
    desc:   'Referred 3 new volunteers',
    metric: 'referrals',
    max:    3,
    badgeId:'community_champion',
  },
  {
    certId: 'green_streak',
    title:  'Green Streak',
    emoji:  '🔥',
    desc:   'Active for 30 days in a row',
    metric: 'streak',
    max:    30,
    badgeId:'green_streak',
  },
  {
    certId: 'plastic_buster',
    title:  'Plastic Buster',
    emoji:  '🏆',
    desc:   'Collected 100kg of plastic (via events)',
    metric: 'totalKgCollected',
    max:    100,
    badgeId:'plastic_buster',
  },
];

/**
 * Award XP, update cert progress, unlock badges.
 * Mutates the user document in-place; caller must call user.save().
 *
 * @param {Object} user   - Mongoose User document
 * @param {number} xpAmt  - XP to award
 * @param {string} reason - e.g. 'JOIN_EVENT'
 */
function awardXP(user, xpAmt, reason = '') {
  user.xp = (user.xp || 0) + xpAmt;
  // Simple levelling: every 500 XP = 1 level
  user.level = Math.floor(user.xp / 500) + 1;
}

/**
 * Check all cert definitions against user metrics and unlock newly earned ones.
 * Returns array of newly earned cert IDs (useful for push notifications later).
 *
 * @param {Object} user - Mongoose User document
 */
function checkCertificates(user) {
  const newlyEarned = [];

  for (const def of CERT_DEFS) {
    // Find or create progress entry
    let prog = user.certProgress.find(p => p.certId === def.certId);
    if (!prog) {
      user.certProgress.push({ certId: def.certId, current: 0, max: def.max, earned: false });
      prog = user.certProgress[user.certProgress.length - 1];
    }

    // Update current value from the user's actual metric
    const current = user[def.metric] || 0;
    prog.current = Math.min(current, def.max);
    prog.max     = def.max;

    // Award if newly completed
    if (!prog.earned && prog.current >= def.max) {
      prog.earned   = true;
      prog.earnedAt = new Date();
      newlyEarned.push(def.certId);

      // Award XP bonus & badge for earning certificate
      awardXP(user, XP.EARN_BADGE, 'EARN_BADGE');

      const alreadyHasBadge = user.badges.some(b => b.id === def.badgeId);
      if (!alreadyHasBadge) {
        user.badges.push({ id: def.badgeId, title: def.title, emoji: def.emoji });
      }
    }
  }

  return newlyEarned;
}

/**
 * Update (or create) the monthly activity bucket for the current month.
 *
 * @param {Object} user
 * @param {Object} delta  - { kgCollected, eventsJoined, scans }
 */
function updateMonthlyActivity(user, delta = {}) {
  const monthKey = new Date().toISOString().slice(0, 7); // "2025-03"
  let bucket = user.monthlyActivity.find(m => m.month === monthKey);
  if (!bucket) {
    user.monthlyActivity.push({ month: monthKey, kgCollected: 0, eventsJoined: 0, scans: 0 });
    bucket = user.monthlyActivity[user.monthlyActivity.length - 1];
  }
  if (delta.kgCollected)   bucket.kgCollected   += delta.kgCollected;
  if (delta.eventsJoined)  bucket.eventsJoined  += delta.eventsJoined;
  if (delta.scans)         bucket.scans         += delta.scans;
}

module.exports = { XP, CERT_DEFS, awardXP, checkCertificates, updateMonthlyActivity };