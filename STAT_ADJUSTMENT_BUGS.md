# Daily Summary Stat Adjustment Bugs - Analysis Report

## Overview
Found **4 major bugs** in the daily summary (nightly stat adjustments) logic that cause incorrect bonuses/penalties to be applied.

---

## Bug #1: Work Streak Bonus on Non-Work Days ⚠️

**Location:** `/server/src/routes/player.ts:256-261` + `/server/src/services/defensive-stats/index.ts:243-253`

**Problem:** Defensive stats are calculated BEFORE tracking is updated, causing streak bonuses to apply on the wrong days.

**Root Cause:**
```typescript
// Line 168: Defensive stats calculated using OLD tracking
const defensiveChanges = await calculateDefensiveStatChanges(pool, player, bedtime);

// Lines 256-261: THEN tracking is updated
workStreak: player.tracking.workedToday
  ? player.tracking.workStreak + 1
  : 0,
```

**Example Bug:**
- Days 1-3: You work → `workStreak` increments to 3
- Day 4: You DON'T work
  - Sleep calculation sees: `workedToday = false`, `workStreak = 3` (from yesterday)
  - Ambition gives "Work streak bonus" (+1.5) ← **WRONG!** You didn't work today
  - Then tracking updates: `workStreak = 0`

**Impact:**
- "Work streak bonus" appears on first rest day after working
- "Completed work activity" bonus missing on actual work days (when streak was 0 but you worked)

---

## Bug #2: "Too Many Consecutive Rest Days" on Work Days ⚠️

**Location:** Same as Bug #1

**Problem:** Rest day penalties apply on the day you START working again.

**Example Bug:**
- Days 1-3: You rest → `restStreak` increments to 3
- Day 4: You WORK
  - Sleep calculation sees: `workedToday = true`, `restStreak = 3` (from yesterday)
  - Vitality gives "Too many consecutive rest days" (-1.5) ← **WRONG!** You worked today
  - Then tracking updates: `restStreak = 0`

**Impact:**
- Rest day penalties appear on first work day after resting
- Creates double penalty: "No work activity today" (-1.0) + "Extended rest period" when you actually worked

---

## Bug #3: "No Catastrophic Failures" Bonus Always Given 🔴

**Location:** `/server/src/routes/activities.ts` (missing update) + `/server/src/services/defensive-stats/index.ts:118-127`

**Problem:** `hadCatastrophicFailureToday` flag is NEVER set to `true` when catastrophic outcomes occur.

**Evidence:**
- Activity endpoint records `outcomeTier: 'catastrophic'` (line 322)
- But tracking flag is never updated
- Flag only gets reset to `false` at sleep (player.ts:269)
- Vitality check sees `!hadCatastrophicFailureToday` and always gives bonus

**Example Bug:**
- You have 5 catastrophic failures today
- `hadCatastrophicFailureToday` stays `false` (never set)
- At sleep: "No catastrophic failures" (+1.0) ← **WRONG!**

**Impact:**
- Free +1.0 Vitality every day regardless of catastrophic failures
- Undermines the defensive stat system's purpose

---

## Bug #4: "Had Negative Social Interaction" on Non-Social Activities ⚠️

**Location:** `/server/src/services/defensive-stats/index.ts:594-613`

**Problem:** Code checks for ANY negative stat effect from ANY activity, not just social interactions.

**Current Logic:**
```typescript
const hadNegativeInteraction = activities.some(a => {
  if (a.statEffects) {
    // ❌ Checks ALL stat effects from ALL activities
    return Object.values(a.statEffects).some(v => v < 0);
  }
  return false;
});

if (hadNegativeInteraction) {
  // Empathy penalty: "Was dismissive or rude"
  change += -2.5;
}
```

**Example Bug:**
- You do a solo work activity (coding, debugging, etc.)
- Get catastrophic outcome → negative fitness/knowledge stats
- Code sees negative stat effects
- Empathy gets "Was dismissive or rude" + "Had negative social interaction" (-2.5) ← **WRONG!**

**Expected Behavior:**
Should only check social activities (category === 'social') with negative empathy/friendship effects.

**Impact:**
- Unfair Empathy penalties for non-social catastrophic outcomes
- Misleading message makes debugging impossible

---

## Additional Issues Found

### Issue #5: "Rest Day After Work" Bonus Logic

**Location:** `/server/src/services/defensive-stats/index.ts:129-142`

**Current Logic:**
```typescript
const workedYesterday = tracking.workStreak >= 1;
const restingToday = !tracking.workedToday;
if (workedYesterday && restingToday) {
  // Vitality: "Rest day after work" (+2.0)
}
```

**Potential Issue:**
- Uses `workStreak >= 1` to detect "worked yesterday"
- But due to Bug #1/#2, this check happens BEFORE streaks are updated
- May apply bonus on wrong days

---

## Summary of Incorrect Messages

| Message | Appears When | Should Appear When | Bug # |
|---------|-------------|-------------------|-------|
| "Work streak bonus" | First rest day after working | While actively working | #1 |
| "Too many consecutive rest days" | First work day after resting | While actively resting | #2 |
| "No catastrophic failures" | Every day (always) | Days without catastrophic outcomes | #3 |
| "Had negative social interaction" | Any activity with negative stats | Social activities with negative outcomes | #4 |

---

## Recommended Fixes

### Fix #1 & #2: Reorder Tracking Updates
**Move tracking updates BEFORE defensive stat calculations** so calculations use current day's data.

### Fix #3: Set Catastrophic Failure Flag
**Add tracking update when catastrophic outcome occurs:**
```typescript
// In activities.ts after outcome is determined
if (outcome?.tier === 'catastrophic') {
  tracking.hadCatastrophicFailureToday = true;
}
```

### Fix #4: Filter Social Activities Only
**Change negative interaction check:**
```typescript
const hadNegativeInteraction = activities.some(a => {
  // Only check social activities
  if (a.category !== 'social') return false;

  // Check for negative empathy/friendship effects
  if (a.statEffects && a.statEffects.empathy < 0) return true;

  return false;
});
```

---

## Testing Recommendations

After fixes, test these scenarios:
1. Work 3 days, rest 1 day → verify no work streak bonus on rest day
2. Rest 3 days, work 1 day → verify no rest penalty on work day
3. Have catastrophic failure → verify NO "no catastrophic failures" bonus
4. Solo work with bad outcome → verify NO "negative social interaction" penalty
5. Social activity with rude outcome → verify YES "negative social interaction" penalty
