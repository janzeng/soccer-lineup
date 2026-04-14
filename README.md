# Lineup Generator

Lineup Generator is a lightweight, browser-based tool designed for youth soccer coaches to create fair, balanced, and strategic player rotations. It supports 7v7, 9v9, and 11v11 formats and utilizes a strict mathematical engine to ensure every child gets equal time in the game.

---

## How it Works

The Lineup Generator is a sideline assistant that handles the complex math of game-day substitutions. It evaluates the roster shift-by-shift using a "Fairness First" priority system.

### The Fair-Play Algorithm (V2 Engine)
The generator tracks every single shift and calculates substitutions based on absolute mathematical equality:
* **Fairness First:** The algorithm prioritizes pulling out players with the highest `In` counts and bringing in players with the highest `Bench` counts. It will naturally achieve a perfect distribution (a maximum difference of 1 shift between any two field players).
* **Positional Preferences:** The engine attempts to slot incoming bench players into the specific positions you checked for them in the roster matrix.
* **The "Force Match" Override:** Playing time is strictly prioritized over player preference. If an incoming player's preferences do not match the positions of the exhausted players currently on the field, the engine will override the preference and *force* the substitution anyway to guarantee fair playing time.

### Goalie Logic
Because Goalkeeper shifts are mandatory and unique, the algorithm uses a smart tie-breaker system to balance goalie field-time without starving them of shifts.
* **1 Goalie:** Plays the net for the entire game.
* **Multiple Goalies:** Goalies share the net. Their required goalie shifts are factored into their total play-time, and the engine automatically staggers their bench shifts during the rest of the game to ensure they get an equal share of time on the field.
* **No Goalies:** If no one on the roster has 'G' checked, the engine initiates an "Empty Net" fallback and forces the entire team to take turns rotating through the goal.

### Position Matrix
Instead of rigid positions, coaches use a checkbox grid. This allows a player to be eligible for multiple areas (e.g., Forward and Defense). 
* **C:** Captain (Visual label on the printout only)
* **S:** Striker
* **F:** Forward
* **M:** Midfield
* **D:** Defense
* **G:** Goalie
* **Abs:** Absent (Overrides all other roles; completely removes the player from the game math but saves their preferences for next week)

### No Subs Lock
If you are playing an "Ironman" game (you have exactly the minimum required players for a format, such as 7 players for 7v7), the engine will automatically lock the field positions for the entire half to prevent players from unnecessarily shuffling positions every shift.

---

## Data Portability (Import/Export)

This app runs entirely in your browser and saves data to your local storage. We built two ways to easily move your roster from your computer to your phone, or share it with an assistant coach.

### 1. Shareable Links (Easiest)
Click **Export Roster -> Copy Shareable Link**. This encodes your entire roster into a URL. Just text or email this link to your assistant coach, and when they click it, the app will open with your exact roster pre-loaded.

### 2. JSON Import/Export (Advanced)
Click **Export Roster -> Copy Roster JSON** to copy your team's configuration to your clipboard as plain text. You can save this text in an email or a notes app for backup. To restore it, click **Import Roster** and paste the JSON data. 

**Example Roster Format:**
```json
{
  "teamName": "Pizza Eaters",
  "format": "7v7",
  "includeSummary": true,
  "players": [
    { "name": "John", "roles": "CMF" },
    { "name": "Michael", "roles": "G" },
    { "name": "Cole", "roles": "GD" },
    { "name": "Andy", "roles": "SF" }
  ]
}
