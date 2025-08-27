# Pick’em Fantasy App - Product Requirements Document (PRD)

# ==============================

## 1. Overview
Pick’em is a fantasy sports application focused on a single global league for the NFL. Users make weekly picks on NFL games, assign confidence points to their picks, and compete on leaderboards. The platform integrates Stripe for payments and manages payouts to winners. The app provides a streamlined experience via responsive web and mobile interfaces, supported by a secure and scalable backend.

# ==============================

## 2. Objectives
- Deliver a seamless user experience for weekly NFL picks and confidence selections.
- Integrate Stripe for payments and manage payouts.
- Provide real-time updates on game results and user standings.
- Ensure data security and privacy compliance.
- Maintain a single global league structure.

# ==============================

## 3. Scope
The MVP will include:
- User registration and authentication.
- Weekly NFL game picks with confidence points.
- Payment integration with Stripe for entry fees.
- Real-time scoring, leaderboards, and payout tracking.
- Responsive UI for web and mobile.
- Admin management of users, funds, and pricing.

Future expansion will add:
- Multi-league support.
- Advanced social features (chat, forums).
- Gamification elements (badges, rewards).
- Admin dashboards and analytics.
- Expanded sports and data integrations.

# ==============================

## 4. User Roles
- **User (Player)**: Registers, makes picks, views standings, manages account, and tracks payouts.
- **Admin**: Manages users, approves payouts, oversees funds, and sets pricing.

# ==============================

## 5. User Stories

### 5.1 User (Player)
- As a user, I want to sign up and log in easily.
- As a user, I want to connect my Stripe account or make payments securely.
- As a user, I want to view upcoming NFL games and make picks with confidence points.
- As a user, I want to edit my picks before deadlines.
- As a user, I want to see my weekly and overall ranking on leaderboards.
- As a user, I want to manage my profile and payment information.
- As a user, I want to track my payouts and payment history.

### 5.2 Admin
- As an admin, I want to manage user accounts.
- As an admin, I want to approve and process payouts.
- As an admin, I want to view and manage collected funds.
- As an admin, I want to set and update pricing and payment rules.

# ==============================

## 6. Functional Requirements

### 6.1 User Management
- Registration via email and social login (Google, Facebook).
- Password reset and account recovery.
- Profile and payment information management.

### 6.2 Payment Integration
- Stripe integration for entry fees and payouts.
- Track user payments and payment history.
- Secure handling of payment data.

### 6.3 Picks Management
- Display weekly NFL games schedule.
- Allow users to make and edit picks with confidence points until deadline.
- Validate picks and confidence assignments.
- Automatic scoring upon game completion.

### 6.4 Standings and Leaderboards
- Calculate weekly and overall scores based on picks and confidence points.
- Display leaderboards with rankings.
- Highlight top performers and payout eligibility.

### 6.5 Payout Management
- Track user earnings and payout status.
- Admin approval workflow for payouts.
- Integration with payment provider for disbursements.

### 6.6 Admin Features
- User account management.
- Fund and payout management dashboard.
- Pricing and payment rules configuration.

# ==============================

## 7. Non-Functional Requirements
- High availability and scalability.
- Secure authentication and data storage.
- Responsive design for desktop and mobile.
- Real-time updates with WebSockets or polling.
- GDPR and CCPA compliance.

# ==============================

## 8. Technical Architecture

### 8.1 Backend
- RESTful API with JSON responses.
- Node.js with Express framework.
- PostgreSQL database.
- Redis for caching and session management.
- WebSocket server for real-time updates.

### 8.2 Frontend
- React.js for web interface.
- React Native for mobile apps (future).
- Responsive UI using Material-UI or similar.

### 8.3 Infrastructure
- Docker containers.
- Kubernetes orchestration.
- CI/CD pipelines with GitHub Actions.
- Cloud hosting on AWS/GCP.

# ==============================

## 9. Database Schema

### 9.1 Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9.2 Games Table
```sql
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport VARCHAR(50) DEFAULT 'NFL',
    season VARCHAR(20),
    week INT,
    home_team VARCHAR(100),
    away_team VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled',
    home_score INT,
    away_score INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9.3 Picks Table
```sql
CREATE TABLE picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    game_id UUID REFERENCES games(id),
    picked_team VARCHAR(100),
    confidence_points INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, game_id)
);
```

### 9.4 Scores Table
```sql
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    week INT,
    points INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, week)
);
```

### 9.5 Payments Table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
    amount_cents INT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    payment_type VARCHAR(50), -- e.g., 'entry_fee', 'payout'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

# ==============================

## 10. API Contracts

### 10.1 Authentication

#### POST /api/auth/register
- Request:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "User123"
}
```
- Response:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "displayName": "User123",
  "token": "jwt-token"
}
```

#### POST /api/auth/login
- Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- Response:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "displayName": "User123",
  "token": "jwt-token"
}
```

### 10.2 Picks

#### GET /api/picks?week=5
- Response:
```json
[
  {
    "gameId": "uuid",
    "homeTeam": "Team A",
    "awayTeam": "Team B",
    "startTime": "2024-09-15T20:00:00Z",
    "status": "scheduled",
    "pickedTeam": "Team A",
    "confidencePoints": 3
  }
]
```

#### POST /api/picks
- Request:
```json
{
  "gameId": "uuid",
  "pickedTeam": "Team A",
  "confidencePoints": 3
}
```
- Response:
```json
{
  "pickId": "uuid",
  "gameId": "uuid",
  "pickedTeam": "Team A",
  "confidencePoints": 3
}
```

### 10.3 Standings

#### GET /api/standings?week=5
- Response:
```json
[
  {
    "userId": "uuid",
    "displayName": "User123",
    "weeklyPoints": 15,
    "overallPoints": 120,
    "rank": 5
  }
]
```

### 10.4 Payments

#### POST /api/payments/entry
- Request:
```json
{
  "stripeToken": "tok_visa",
  "amountCents": 5000
}
```
- Response:
```json
{
  "paymentId": "uuid",
  "status": "succeeded"
}
```

#### GET /api/payments/history
- Response:
```json
[
  {
    "paymentId": "uuid",
    "amountCents": 5000,
    "status": "succeeded",
    "paymentType": "entry_fee",
    "createdAt": "2024-09-01T12:00:00Z"
  }
]
```

### 10.5 Admin

#### GET /api/admin/users
- Response:
```json
[
  {
    "userId": "uuid",
    "email": "user@example.com",
    "displayName": "User123",
    "status": "active"
  }
]
```

#### POST /api/admin/payouts/approve
- Request:
```json
{
  "userId": "uuid",
  "amountCents": 10000
}
```
- Response:
```json
{
  "payoutId": "uuid",
  "status": "approved"
}
```

#### POST /api/admin/pricing
- Request:
```json
{
  "entryFeeCents": 5000
}
```
- Response:
```json
{
  "entryFeeCents": 5000
}
```

# ==============================

## 11. Frontend File Structure

```
/src
  /api
    auth.js
    picks.js
    standings.js
    payments.js
    admin.js
  /components
    /Auth
      LoginForm.jsx
      RegisterForm.jsx
    /Picks
      PicksList.jsx
      PickItem.jsx
    /Standings
      StandingsList.jsx
    /Payments
      PaymentCTA.jsx
      PaymentHistory.jsx
    /Admin
      UserManagement.jsx
      PayoutApproval.jsx
      PricingSettings.jsx
    /Shared
      Header.jsx
      Footer.jsx
      Notification.jsx
  /context
    AuthContext.jsx
    PicksContext.jsx
    PaymentsContext.jsx
    AdminContext.jsx
  /hooks
    useAuth.js
    usePicks.js
    usePayments.js
    useAdmin.js
  /pages
    Home.jsx
    Login.jsx
    Register.jsx
    Picks.jsx
    Standings.jsx
    Payments.jsx
    Admin.jsx
  /styles
    main.css
  App.jsx
  index.jsx
```

Note: The application supports only a single global NFL league for the MVP. Components and endpoints related to multiple leagues or league creation are excluded.

# ==============================

## 12. UX and UI

### 12.1 Design Principles
- Clean, intuitive interfaces.
- Mobile-first responsive design.
- Clear calls to action.
- Accessible color schemes and fonts.

### 12.2 Wireframes
- Home page showing current week’s NFL games and picks.
- Picks page with game list, pick options, and confidence assignment.
- Standings page with weekly and overall leaderboards.
- Payments page with entry fee payment and payout history.
- Admin dashboard for user and payout management.

# ==============================

## 13. Testing Strategy

### 13.1 Unit Tests
- Backend: Jest with coverage for API endpoints and business logic.
- Frontend: React Testing Library for components and hooks.

### 13.2 Integration Tests
- End-to-end tests with Cypress covering user registration, payment flows, picks submission, and leaderboard updates.

### 13.3 Performance Testing
- Load testing backend APIs with k6 or similar tools.

### 13.4 Security Testing
- Vulnerability scans and penetration testing.
- Payment security compliance testing.

# ==============================

## 14. Deployment Plan
- Staging environment for QA.
- Production environment with zero downtime deployment.
- Automated backups and monitoring.
- Rollback procedures documented.

# ==============================

## 15. Monitoring and Analytics
- Use Prometheus and Grafana for system metrics.
- Application logs aggregated via ELK stack.
- User behavior analytics with Mixpanel or Google Analytics.

# ==============================

## 16. Security Considerations
- Enforce HTTPS.
- Use JWT tokens for authentication.
- Hash passwords with bcrypt.
- Validate and sanitize all inputs.
- Role-based access control for APIs.
- PCI compliance for payment processing.

# ==============================

## 17. Compliance
- GDPR compliance for EU users.
- CCPA compliance for California users.
- Privacy policy and terms of service drafted.

# ==============================

## 18. Internationalization
- Support for English initially.
- Framework for adding additional languages.

# ==============================

## 19. Backup and Recovery
- Daily database backups.
- Disaster recovery plan with RTO and RPO defined.

# ==============================

## 20. Documentation
- API documentation using Swagger/OpenAPI.
- User guides and FAQs.
- Developer onboarding documentation.

# ==============================

## 21. Roadmap

| Phase         | Features                                  | Timeline       |
|---------------|-------------------------------------------|----------------|
| Phase 1 (MVP) | User auth, weekly NFL picks, payments, scoring, leaderboards, payouts | Weeks 1-6      |
| Phase 2       | Notifications, mobile app, enhanced admin dashboard | Weeks 7-12     |
| Phase 3       | Multi-league support, social features, gamification | Weeks 13-18    |

# ==============================

## 22. Risks and Mitigation

| Risk                         | Mitigation                                    |
|------------------------------|-----------------------------------------------|
| Missed pick deadlines         | Timely reminders, flexible editing windows   |
| Payment processing issues     | Use reliable payment provider, thorough testing |
| Low user engagement           | Marketing, incentives, clear UX               |
| Security vulnerabilities      | Regular audits, secure coding practices       |
| Scalability issues            | Cloud infrastructure, load testing            |

# ==============================

## 23. Admin Panel Features
- User management (activate, suspend).
- Payout approval and processing.
- Fund management and reporting.
- Pricing and payment rules configuration.

# ==============================

## 24. External Integrations
- Stripe for payments and payouts.
- Sports data APIs for NFL games and scores.
- Email service providers (SendGrid, SES).
- Push notification services (Firebase Cloud Messaging).

# ==============================

## 25. Contact and Support
- Support email: support@pickemapp.com
- Developer Slack channel.
- Regular update meetings and retrospectives.

# ==============================

## 26. Future Expansion
- Multi-league support with league creation and management.
- Advanced social features including chat and forums.
- Gamification elements such as badges and rewards.
- Mobile app with React Native.
- Expanded sports and data integrations.
- Enhanced admin dashboards and analytics.

# ==============================

# End of Document
