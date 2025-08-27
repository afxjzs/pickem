# Task List for MVP

## M0: Project Setup ✅ COMPLETE
- [x] Initialize project repository
- [x] Set up development environment
- [x] Configure version control and branching strategy
- [x] Set up Next.js and Tailwind v4
- [x] Set up Supabase backend

## M1: Database & Migrations ✅ COMPLETE
- [x] Create database schema and migrations
- [x] Set up Supabase local instance
- [x] Apply initial migration
- [x] Seed database with sample data

## M2: Authentication System ✅ COMPLETE
- [x] Implement user registration and login (Supabase)
- [x] Set up homepage with dynamic content based on auth state
- [x] Add navigation and basic layout
- [x] Create protected dashboard route
- [x] Implement sign out functionality
- [x] Add route protection and redirects
- [x] Write comprehensive unit tests (14/14 passing)
- [x] Fix test console errors and ensure clean output

## M3: Data APIs Integration 🔄 NEXT MILESTONE
- [ ] Research and trial sports data APIs (SRC: https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c)
- [ ] Fetch and display NFL schedule
- [ ] Fetch and display matchups, standings, teams, and past results
- [ ] Validate and adapt to API data shape
- [ ] Build backend endpoints to proxy/normalize data as needed

## M4: Picks & Leaderboards
- [ ] Implement picks UI and backend logic
- [ ] Allow users to make/edit picks with confidence points
- [ ] Calculate and display weekly/overall leaderboards
- [ ] Display user standings

## M5: Payments & Payouts
- [ ] Integrate Stripe for entry payments
- [ ] Track user payments and payment history
- [ ] Implement payout tracking and admin approval
- [ ] Integrate Stripe payouts

## M6: Testing & Deployment
- [x] Write unit and integration tests
- [ ] Set up CI/CD pipelines
- [ ] Deploy MVP to production environment
- [ ] Monitor performance and fix bugs

## Current Status
**M2 (Authentication) is 100% complete and functional!**
- All authentication features working: signup, signin, dashboard, signout
- Route protection implemented
- All tests passing (14/14) with clean output
- Ready to proceed to M3 (Data APIs Integration)

## Next Steps
1. **M3**: Integrate NFL data APIs to display real schedule and standings
2. **M4**: Build picks system and leaderboards
3. **M5**: Implement Stripe payments and payouts
