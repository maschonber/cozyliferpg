# Game Design

## Core Fantasy

You arrive alone in a small coastal town for a fresh start. Through daily routines, chance encounters, and deliberate choices, you build a life—finding work, making friends, pursuing romance, and discovering your place in this community.

The fantasy is not heroic adventure but authentic connection: coffee dates, deep conversations, personal growth, and the slow development of trust and intimacy. The town itself is a character, and its residents become your neighbors, friends, rivals, and lovers.

## The Central Tension

You have to work, but you *want* to connect.

Economic pressure (rent, upgrades, survival) competes with social desires (relationships, self-improvement, leisure). This tension creates meaningful choices: Do you take the extra shift or meet someone for dinner? The cozy moments feel earned because you carved out time for them.

Stakes exist not to punish but to make choices matter.

## Design Pillars

### 1. Relationships Have Depth

Relationships are not binary (friend/not friend) or linear (acquaintance → friend → romance). The three-axis model (trust, affection, desire) creates nuanced states:

- High trust, low affection: A reliable colleague you don't particularly like
- High desire, low trust: Attraction without safety
- High affection, low desire: Deep friendship without romance

This enables relationship stories that feel real. Romance is a natural outcome of connection, not a minigame to win.

### 2. NPCs Feel Alive

The game rises and falls on how real the neighbors feel:

- **Personality:** Traits shape preferences, reactions, and compatibility
- **Emotion:** NPCs have moods that shift based on interactions and events
- **Agency:** NPCs move, visit, avoid, and (eventually) pursue their own goals
- **Discovery:** You learn who they are through time spent, not stat sheets

Procedural generation creates variety; emergent behavior creates stories.

### 3. Outcomes, Not Pass/Fail

Activities have multiple outcome tiers, not binary success/failure. Even "bad" outcomes advance the story—a catastrophic conversation might damage trust but reveal something true.

Failure is interesting, not frustrating. The game doesn't hard-block progress.

### 4. Time Creates Rhythm

Time is a resource and a narrative device:

- **Daily:** Activities consume hours, forcing prioritization
- **Seasonal:** Weather, holidays, and events break monotony
- **Long-term:** Play unfolds over in-game years (with compressed calendars)

The passage of time makes relationships feel earned and progress feel real.

## Core Loop

```
Choose Activity → Resolve Outcome → Apply Effects → Advance Time → Repeat
```

**Choose Activity:** Select from available activities based on location, time, energy, money, and (for social activities) NPC availability. Stats and relationship states gate or unlock activity variants.

**Resolve Outcome:** Activities with difficulty use dice mechanics. Stats provide bonuses. Outcome tier determines effect magnitude.

**Apply Effects:** Stat changes, relationship deltas, energy costs, money gains/losses, NPC emotion shifts, potential trait discovery.

**Advance Time:** Clock moves forward. New activities become available or unavailable.

## Progression Systems

### Economic Pressure

Money creates the baseline tension:

- **Rent:** Regular payments force consistent income
- **Upgrades:** Apartment improvements, items that ease gameplay
- **Jobs:** Better stats unlock better jobs with better pay-to-time ratios

Economic stability frees time for what matters—relationships and growth.

### Character Stats

Nine stats across three domains:

- **Physical:** Fitness, Vitality, Poise
- **Mental:** Knowledge, Creativity, Ambition
- **Social:** Confidence, Wit, Empathy

Stats have base values (slow, permanent growth) and current values (daily fluctuation around base).

**Two training systems:**

- **Active training:** Grindable activities directly train specific stats through practice
- **Lifestyle gains:** Overnight adjustments reward varied, balanced play—meta conditions like "exercised today" or "had a social interaction" influence stats - some more than others

**Stats enable progression:**

- Higher stats improve activity outcomes (dice bonuses)
- Stat thresholds unlock better jobs and new activities
- Some activities or variants require minimum stats

### Relationships

Relationships progress through states based on axis thresholds. The three-axis model enables non-linear paths—friendship and romance aren't a ladder but a space to explore.

States unlock through natural interaction, not explicit "relationship level up" moments. Relationship states also gate activities—deeper connections enable more intimate or collaborative options.

### NPCs

NPCs have:

- **Traits:** Hidden personality aspects discovered through interaction
- **Emotions:** Dynamic moods (Plutchik model) affecting behavior and visuals
- **Location:** Where they can be found; will move based on schedules and preferences
- **Agency:** React to player (approach when happy, avoid when angry); eventually pursue own goals
- **History:** Relationship trajectory and interaction log with player

NPCs (eventually) exist in the world from the start; players *discover* them through activities and exploration.

## Tone and Themes

**The mood is:**

- Lighthearted and friendly, even when stakes are real
- Uplifting—progress feels good, setbacks feel temporary
- A little chaotic and messy, like real life
- Inviting—NPCs are naturally attractive and approachable

**Core themes:**

- Finding your place in a community
- Building trust takes time
- Vulnerability enables intimacy
- Everyone has hidden depths
- Small kindnesses compound

**Cozy with teeth:** Stakes exist (rent, damaged relationships, time pressure) but the overall arc bends toward warmth. Pressure creates meaning; it doesn't create misery.

## What This Game Is

- **A life sandbox:** No fixed story; emergent narrative from systems
- **A dating sim (among other things):** Romance is a draw, not the only goal
- **A game first:** Stats matter, routines can be optimized, systems are gamified
- **A story generator:** Play sessions create memorable moments and arcs
- **Replayable:** Customizable player character, procedural NPCs, and (eventually) varied towns

## What This Game Is Not

- **Not a completionist checklist:** Discovery over collection
- **Not punishing:** Failure is interesting, not frustrating
- **Not a pure simulation:** Fun trumps realism when they conflict
- **Not linear:** No main quest, no prescribed path

## Future Directions

Systems planned but not yet implemented:

- **Seasons and weather:** Breaking daily monotony, enabling seasonal activities
- **Holidays and events:** Shared community moments, special activities
- **NPC movement:** Schedules, preferences, reactive positioning
- **NPC summoning:** Invite NPCs to locations
- **Economic depth:** Rent, upgrades, job progression
- **Procedural towns:** Increased replay value through varied starting conditions
- **Story characters:** Light tutorial/guidance through special NPCs

The town is currently static to allow proper testing of core systems before adding procedural complexity.
