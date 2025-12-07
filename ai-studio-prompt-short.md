# Optometry Store Management System - AI Studio Prompt

Build a modern web application for managing customers and prescriptions for an optometry store using a microservices architecture (Frontend, Backend, Database).

## CRITICAL REQUIREMENT: Single-Page Experience
Everything must appear on ONE screen without page transitions. When searching for a customer, all their information (personal details, prescriptions, payments) appears dynamically on the same page through real-time updates.

## Architecture
- **Frontend**: React 18+ with TypeScript, Tailwind CSS, React Query, Framer Motion
- **Backend**: Node.js/Express or FastAPI with RESTful API
- **Database**: PostgreSQL with Prisma ORM

## Core Features

### 1. Customer Management
- Search by ID, name, or phone (real-time, debounced)
- Display all customer info in editable panels
- Israeli ID validation with checksum
- Auto-save functionality

### 2. Prescription Management
- Create, edit, delete, duplicate prescriptions
- Types: "מרחק" (distance), "קריאה" (reading), "עדשות מגע" (contact lenses)
- Optical measurements: R, L, PD, Cyl R/L, AX R/L, ADD
- Auto-calculate prices based on index, discount source, campaigns
- Convert distance to reading prescription: R+ADD, L+ADD, PD-3
- Payment tracking: amount to pay, paid, balance

### 3. Business Logic
- Price calculation rules:
  - Index 1.5: above 70 / below 71
  - Index 1.56: above 112 / below 112
  - Index 1.6: =270 / above 270
  - Index above 1.6
- Discount source handling ("מאוחדת שיא", etc.)
- Campaign 280 integration

### 4. PDF Generation
- Generate prescription PDFs
- Format: SICUM_[ID]_[DATE]_050_00663_[PASSPORT_FLAG]_001.pdf
- Organized folder structure by year/month

## Data Model

**Customers (אנשים)**: ID, dates, names, ID number, passport flag, birth date, address (street, house, entrance, apartment, city), phones (landline, mobile 1, mobile 2), health fund, category, admission date, employee ID, computer ID

**Prescriptions (מרשמים)**: Prescription ID, customer ID, type, date, R, L, PD, Cyl R/L, AX R/L, ADD, index, color, color %, price, discount source, amount to pay, paid, balance, receipt #, campaign 280, optometrist ID, branch ID, source, notes, update date

**Supporting**: Branches, Employees, Optometrists, Campaigns

## UI/UX Requirements
- Modern, clean design with Hebrew/RTL support
- Instant search (<100ms)
- Smooth animations (60fps)
- Loading states, toast notifications
- Responsive (desktop-first)
- Accessible (WCAG 2.1 AA)

## Layout
```
┌─────────────────────────────────────────┐
│  Search Bar (always visible)           │
├──────────────┬─────────────────────────┤
│ Customer     │ Prescriptions List      │
│ Info Panel   │ [Prescription 1]        │
│ [Editable]   │ [Prescription 2]        │
│              │ ...                     │
├──────────────┴─────────────────────────┤
│ Payment & Financial Info               │
└─────────────────────────────────────────┘
```

## API Endpoints
```
GET    /api/customers/search?q={query}
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
GET    /api/customers/:id/prescriptions
GET    /api/prescriptions/:id
POST   /api/prescriptions
PUT    /api/prescriptions/:id
DELETE /api/prescriptions/:id
POST   /api/prescriptions/:id/duplicate
POST   /api/prescriptions/:id/convert-to-reading
POST   /api/prescriptions/:id/calculate-price
POST   /api/prescriptions/:id/generate-pdf
```

## Performance Targets
- Search: <100ms
- Page load: <2s
- Support: 10K+ customers, 50K+ prescriptions

## Deliverables
Complete source code for all three microservices, database schema, API docs, setup instructions, environment configs, sample data.

**Provide production-ready, well-documented code following all requirements above.**

