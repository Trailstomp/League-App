# Tournament Games Live Scoring Workflow

## Overview
This document describes the new workflow for accessing and scoring individual games within tournament events.

## Features Implemented

### 1. **Hybrid Navigation System (Option C)**
Tournament brackets now have TWO ways to access individual games:
- **Bracket View**: Visual bracket display with action buttons on each match card
- **Games List View**: Table-based list of all tournament matches

### 2. **Match Action Buttons**
Each match (with both teams assigned) has three action buttons:

**In Bracket View:**
- **✏️ Quick Score**: Quick inline score entry (existing functionality)
- **📊 Live Score**: Opens full EnhancedLiveStatsEntry for detailed stats tracking
- **🔴 Live View**: Opens spectator view for that specific match

**In Games List View:**
- **📊 Live Score**: Opens full live stats entry
- **🔴 Live**: Opens spectator view

### 3. **Tournament "Enter Scores" Redirect**
When clicking "Enter Scores" on a tournament event from the Events List:
- Redirects directly to the tournament bracket view
- Users can then select specific matches to score
- No longer goes to the generic scoring selector

### 4. **Unique Match Event IDs**
Each match generates a unique event ID:
- Format: `{tournament_id}_match_{match_id}`
- Example: `uuid123_match_round1_match2`
- Allows independent tracking of each match's live stats

### 5. **Edit Completed Matches**
All matches, including completed ones, can be edited:
- Allows corrections to scores and stats
- Live Score button available for all matches with assigned teams

## User Workflow

### Method 1: Via Bracket View
1. Navigate to Events Management
2. Click "🏅 Manage Bracket" on a tournament event
3. View the bracket in visual format
4. Click "📊 Live Score" on any match card
5. Enter detailed stats using EnhancedLiveStatsEntry
6. Stats are saved and bracket is updated automatically
7. Return to bracket view

### Method 2: Via Games List
1. Navigate to Events Management
2. Click "🏅 Manage Bracket" on a tournament event
3. Switch to "📋 Games List" tab
4. See all matches in a table format with:
   - Round name
   - Match ID
   - Teams
   - Current score
   - Status (Pending/In Progress/Completed)
5. Click "📊 Live Score" on any match row
6. Enter stats and save

### Method 3: Direct Scoring from Events List
1. Navigate to Events Management
2. Click "🎯 Enter Scores" on a tournament event
3. Automatically redirected to bracket view
4. Select specific match to score

## Technical Details

### Data Flow
```
Tournament Event
  ↓
Bracket Data (rounds[].matches[])
  ↓
Individual Match
  ↓
Synthetic Match Event (with unique ID)
  ↓
EnhancedLiveStatsEntry
  ↓
Save to unified_events collection
  ↓
Update tournament bracket with scores
```

### Match Event Structure
```javascript
{
  id: "{tournament_id}_match_{match_id}",
  type: "tournament_match",
  title: "Team A vs Team B",
  description: "Tournament Name - Round 1",
  date: "2025-01-15",
  time: "19:00",
  location: "Tournament Venue",
  teams: ["team_a_id", "team_b_id"],
  status: "in_progress",
  tournament_id: "parent_tournament_id",
  match_id: "round1_match1",
  round_index: 0,
  match_index: 0
}
```

### Score Synchronization
When live stats are saved for a match:
1. Stats are saved to `unified_events` collection with match event ID
2. Scores are extracted from `statsData`
3. Bracket match is updated with:
   - `score1` and `score2`
   - `winner` (based on scores)
   - `status` ('completed' or 'tied')
4. Updated bracket is saved to parent tournament event

## Components Modified

### 1. TournamentBracketBuilder.js
- Added `onLiveScore` prop
- Added `activeTab` state ('bracket' or 'games-list')
- Added tab navigation UI
- Added helper functions: `getAllMatches()`, `getMatchStatusDisplay()`
- Enhanced MatchCard with "Live Score" button
- Created new Games List table view

### 2. EventManager.js
- Added `selectedMatch` state
- Added `tournament-match-scoring` view state
- Created `generateMatchEventId()` helper
- Created `createMatchEvent()` helper
- Updated tournament case to pass `onLiveScore` handler
- Added new case for `tournament-match-scoring`
- Modified `onEnterScoring` to redirect tournaments to bracket view
- Added score sync logic back to bracket

## Benefits

1. **Clear Workflow**: Users know exactly how to access individual games
2. **Flexibility**: Two navigation methods (visual + list) for different preferences
3. **Complete Stats**: Full EnhancedLiveStatsEntry for each match, not just scores
4. **Data Integrity**: Unique IDs prevent conflicts between matches
5. **Editing**: Can correct any match at any time
6. **Automatic Sync**: Bracket updates automatically when match stats are saved

## Future Enhancements

Potential improvements:
- Real-time updates for live spectators during tournament matches
- Bracket auto-advancement based on match completion
- Tournament standings calculation
- Match scheduling within tournaments
- Referee/scorekeeper assignments per match
