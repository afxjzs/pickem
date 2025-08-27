# Pick'em Fantasy App — Project Handoff Brief

## Current Status
- **Authentication & Homepage Scaffold**: ✅ Complete  
  User registration, login, and protected dashboard are fully functional.  
  Homepage displays different content based on authentication state.

## Next Priorities

### 1. Data APIs Exploration & Normalization
- Integrate multiple NFL data APIs (e.g., TheSportsDB, Sportsdata.io, MySportsFeeds).  
- Fetch and normalize data for:  
  - Schedule  
  - Matchups  
  - Standings  
  - Teams  
  - Past results  
- Ensure data matches backend schema for seamless use in the app.

### 2. Picks & Leaderboards
- Enable users to make and edit weekly picks with confidence points before deadlines.  
- Calculate weekly and overall leaderboard standings based on user picks.  
- Display updated leaderboards dynamically.

### 3. Payments & Payouts
- Integrate Stripe for entry fee payments.  
- Implement secure payment API endpoints.  
- Track payment and payout statuses for users.  
- Enable admin-triggered payouts.

## Acceptance Criteria
- Users can register/login and access the protected dashboard.  
- NFL data loads correctly from APIs and displays in the app.  
- Users can submit picks and see accurate leaderboard updates.  
- Payments process successfully, and payout statuses are tracked.

## Next Steps for Executor
1. Begin with API exploration and data normalization for NFL data.  
2. Develop picks submission and leaderboard functionality.  
3. Integrate payment processing and payout management.

For detailed task lists and support, refer to the project repository documentation.