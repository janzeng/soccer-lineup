# Lineup Generator

Lineup Generator is a lightweight, browser-based tool designed for youth soccer coaches to create fair, balanced, and strategic player rotations. It supports 7v7, 9v9, and 11v11 formats and tries to balance shifts to ensure every child gets equal time in the game.
---

## How it Works

The Lineup Generator is a sideline assistant that follows specific logic to make game-day management easier and more equitable.

### The Fair-Play Algorithm
The generator tracks every shift. When calculating substitutions:
* **Priority In:** It prioritizes bringing in players who have spent the most total time on the bench.
* **Priority Out:** It pulls out players who have played the most consecutive shifts (the "highest streak").
* **Position Guards:** A player will only be substituted into positions you have explicitly checked for them in the roster matrix.

### Goalie Logic
The app handles goalkeeper transitions based on how many players are assigned in the roster.
* **1 Goalie:** Plays the entire game.
* **2 Goalies:** Swaps at halftime (Quarter 3). 
  * *The "Gear Up" Rule:* To ensure the second-half goalie is ready, they will be benched during Quarter 2, Shift 2 so they have time to put on their gloves and jersey.
* **3+ Goalies:** Rotates the goalkeeper role every quarter.

### Position Matrix
Instead of rigid positions, coaches use a checkbox grid. This allows a player to be eligible for multiple areas (e.g., Forward and Defense). 
* **C:** Captain (Visual label only)
* **G:** Goalie
* **S:** Striker
* **F:** Forward
* **M:** Midfield
* **D:** Defense
* **Abs:** Absent (Overrides all other roles; removes player from the game math)

---

## Data Portability (Import/Export)

This app runs entirely in your browser and saves data to your local storage. To move your roster from a computer to a phone, or share a lineup with an assistant coach, use the Export/Import feature.

### Exporting
Click Export Roster to copy your team's configuration to your clipboard as a plain-text JSON string.

### Importing
Click Import Roster and paste your JSON data into the text area. 

**Example Roster Format:**
```json
{
  "teamName": "Pizza Eaters",
  "format": "7v7",
  "players": [
    { "name": "John", "roles": ["C", "M", "F"] },
    { "name": "Michael", "roles": ["G"] },
    { "name": "Cole", "roles": ["G"] },
    { "name": "Andy", "roles": ["S", "F"] }
  ]
}
