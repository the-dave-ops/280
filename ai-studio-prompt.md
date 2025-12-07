# Professional Prompt for Google AI Studio: Optometry Store Management System

## Project Overview

I need to build a modern, high-performance web application for managing customers and prescriptions for an optometry store. The system should be built using cutting-edge technologies with exceptional UI/UX, following a microservices architecture.

## Architecture Requirements

The application must consist of **three separate microservices**:
1. **Frontend Service** - Modern, responsive web interface
2. **Backend Service** - RESTful API with business logic
3. **Database Service** - Data persistence layer

## Core Design Principle: Single-Page Experience

**CRITICAL REQUIREMENT**: The entire application must operate on a **single, unified screen** without page transitions or navigation between views. When a user searches for a customer, all customer information, prescriptions, payment history, and related data must appear dynamically on the same page through smooth, real-time updates.

### User Experience Flow:
- User enters search criteria (ID number, name, phone, etc.) in a search bar
- Search results appear instantly below/alongside the search bar
- Upon selecting a customer, the page dynamically expands/reveals:
  - Customer personal information panel
  - Prescriptions list/table
  - Payment and financial information
  - Historical data and notes
  - All without leaving or reloading the page

## Technology Stack Requirements

### Frontend:
- **Framework**: React 18+ with TypeScript OR Next.js 14+ (App Router) OR Vue 3 with Composition API
- **State Management**: Zustand, Redux Toolkit, or Pinia (for Vue)
- **UI Framework**: Tailwind CSS with a modern component library (shadcn/ui, Radix UI, or Headless UI)
- **Real-time Updates**: React Query / TanStack Query for server state management
- **Animations**: Framer Motion or similar for smooth transitions
- **Form Handling**: React Hook Form or Formik with Zod validation
- **RTL Support**: Full Hebrew (RTL) language support

### Backend:
- **Runtime**: Node.js with Express/Fastify OR Python with FastAPI OR Go with Gin
- **API Style**: RESTful API with OpenAPI/Swagger documentation
- **Validation**: Input validation and sanitization
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Performance**: Optimized queries, caching where appropriate

### Database:
- **Primary Database**: PostgreSQL 15+ (recommended) OR MySQL 8+ OR MongoDB (if document-based approach)
- **ORM/ODM**: Prisma, TypeORM, SQLAlchemy, or Mongoose
- **Migrations**: Proper database migration system
- **Indexing**: Optimized indexes for search performance

## Data Model Requirements

Based on the legacy Microsoft Access application, the system must handle:

### Core Entities:

1. **Customers (אנשים)**
   - Personal ID (מזהה איש) - Primary Key
   - Date (תאריך)
   - Last Name (שם משפחה)
   - First Name (שם פרטי)
   - ID Number (תעודת זהות) - with validation
   - Passport flag (דרכון) - boolean
   - Birth Date (תאריך לידה)
   - Address: Street (רחוב), House Number (מספר בית), Entrance (כניסה), Apartment (דירה), City (עיר)
   - Phone (טלפון)
   - Mobile 1 (נייד 1)
   - Mobile 2 (נייד 2)
   - Health Fund (קופת חולים)
   - Category (קטגוריה)
   - Admission Date (תאריך קליטה)
   - Employee ID (מזהה עובד)
   - Computer ID (מזהה מחשב)

2. **Prescriptions (מרשמים)**
   - Prescription ID (מזהה מרשם) - Primary Key
   - Customer ID (מזהה לקוח) - Foreign Key
   - Type (סוג): "מרחק" (distance), "קריאה" (reading), "עדשות מגע" (contact lenses)
   - Date (תאריך)
   - **Optical Measurements:**
     - R (Right eye sphere)
     - L (Left eye sphere)
     - PD (Pupillary Distance)
     - Cyl R (Right cylinder)
     - AX R (Right axis)
     - Cyl L (Left cylinder)
     - AX L (Left axis)
     - ADD (Addition for reading)
   - Index (אינדקס)
   - Color (צבע)
   - Color Percentage (אחוז צבע)
   - Price (מחיר)
   - Discount Source (מקור הנחה)
   - Amount to Pay (לתשלום)
   - Paid (שולם)
   - Balance (יתרה)
   - Receipt Number (מס קבלה)
   - Campaign 280 (מבצע 280)
   - Optometrist ID (מזהה אופטומטריסט)
   - Branch ID (מזהה סניף)
   - Source (מקור מרשם)
   - Notes (הערות)
   - Update Date (תאריך עדכון)

3. **Supporting Entities:**
   - Branches (סניפים)
   - Employees (עובדים)
   - Optometrists (אופטומטריסטים)
   - Campaigns/Promotions (מבצעים)

## Functional Requirements

### 1. Customer Management
- **Search Functionality:**
  - Search by ID number (תעודת זהות)
  - Search by name (first name, last name, or both)
  - Search by phone number
  - Real-time search with debouncing
  - Fuzzy search capabilities
  - Search results displayed instantly

- **Customer Display:**
  - All customer information displayed in organized panels
  - Editable inline forms
  - Auto-save functionality
  - Validation for Israeli ID numbers (with checksum validation)
  - Date pickers for date fields
  - Address autocomplete (optional enhancement)

### 2. Prescription Management
- **Prescription Operations:**
  - Create new prescription
  - Edit existing prescription
  - Delete prescription (with confirmation)
  - Duplicate/clone prescription
  - Navigate between prescriptions (first, previous, next, last)
  - Convert distance prescription to reading prescription (with ADD calculation)

- **Prescription Calculations:**
  - Automatic price calculation based on:
    - Index value
    - Discount source
    - Campaign 280
    - Various business rules (as per legacy queries)
  - Balance calculation (Amount to Pay - Paid)
  - Real-time updates when fields change

- **Prescription Display:**
  - Table/list view of all prescriptions for selected customer
  - Detailed view for selected prescription
  - Visual indicators for prescription types
  - Payment status indicators

### 3. Business Logic
- **ID Validation:**
  - Israeli ID number validation with checksum algorithm
  - Support for both ID numbers and passport numbers

- **Price Updates:**
  - Automatic price updates based on queries:
    - Index 1.5 above 70
    - Index 1.5 below 71
    - Index 1.56 greater than 112
    - Index 1.6 = 270
    - Index 1.6 above 270
    - Index 1.56 below 112
    - Index above 1.6
  - Price calculation based on discount source

- **Prescription Conversion:**
  - Convert "מרחק" (distance) to "קריאה" (reading)
  - Formula: R + ADD, L + ADD, PD - 3
  - Only allowed when ADD > 0
  - Cannot convert reading prescription to reading

### 4. PDF Generation
- Generate PDF reports for prescriptions
- Format: SICUM_[ID]_[DATE]_050_00663_[PASSPORT_FLAG]_001.pdf
- Store in organized folder structure by year/month
- Support for batch PDF generation

### 5. Data Integrity
- Foreign key relationships
- Referential integrity
- Transaction support for critical operations
- Audit trail for important changes (optional but recommended)

## UI/UX Requirements

### Design Principles:
1. **Modern, Clean Interface:**
   - Minimalist design with ample white space
   - Professional color scheme suitable for medical/retail environment
   - High contrast for readability
   - Accessible design (WCAG 2.1 AA compliance)

2. **Responsive Design:**
   - Desktop-first approach (primary use case)
   - Tablet compatibility
   - Mobile-friendly for quick lookups

3. **Performance:**
   - Instant search results (< 100ms response time)
   - Smooth animations (60fps)
   - Optimistic UI updates
   - Lazy loading for large datasets
   - Virtual scrolling for long lists

4. **User Feedback:**
   - Loading states for async operations
   - Success/error notifications (toast messages)
   - Confirmation dialogs for destructive actions
   - Form validation with inline error messages
   - Auto-save indicators

5. **Hebrew/RTL Support:**
   - Full RTL layout support
   - Hebrew fonts (Arial, David, or similar)
   - Proper date formatting (DD/MM/YYYY)
   - Number formatting for Hebrew locale

### Layout Structure:
```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo, Search Bar (prominent, always visible)   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │              │  │                                 │ │
│  │  Customer    │  │  Prescriptions List/Details     │ │
│  │  Info Panel  │  │                                 │ │
│  │              │  │  [Prescription 1]               │ │
│  │  [Editable]  │  │  [Prescription 2]               │ │
│  │              │  │  [Prescription 3]               │ │
│  │              │  │  ...                            │ │
│  │              │  │                                 │ │
│  └──────────────┘  └─────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Payment & Financial Information                    │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Technical Implementation Details

### API Endpoints (Suggested Structure):

```
GET    /api/customers/search?q={query}
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id

GET    /api/customers/:id/prescriptions
GET    /api/prescriptions/:id
POST   /api/prescriptions
PUT    /api/prescriptions/:id
DELETE /api/prescriptions/:id
POST   /api/prescriptions/:id/duplicate
POST   /api/prescriptions/:id/convert-to-reading
POST   /api/prescriptions/:id/calculate-price

GET    /api/branches
GET    /api/optometrists
GET    /api/campaigns

POST   /api/prescriptions/:id/generate-pdf
```

### Database Schema Considerations:
- Proper indexing on search fields (ID number, names, phone)
- Composite indexes for common query patterns
- Foreign key constraints
- Check constraints for data validation
- Timestamps for audit purposes

### Security Requirements:
- Input sanitization
- SQL injection prevention (use parameterized queries)
- XSS protection
- CORS configuration
- Rate limiting for API endpoints
- Authentication/Authorization (if multi-user system)

## Development Best Practices

1. **Code Quality:**
   - TypeScript for type safety
   - ESLint/Prettier for code formatting
   - Comprehensive error handling
   - Logging for debugging

2. **Testing:**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests for critical user flows

3. **Documentation:**
   - API documentation (OpenAPI/Swagger)
   - Code comments for complex logic
   - README with setup instructions

4. **Version Control:**
   - Git with meaningful commit messages
   - Feature branches
   - Code review process

## Performance Targets

- Search response time: < 100ms
- Page load time: < 2 seconds
- Time to interactive: < 3 seconds
- Database query optimization: < 50ms for simple queries
- Support for 10,000+ customers
- Support for 50,000+ prescriptions

## Migration Considerations

- Data migration script from legacy Access database
- Data validation and cleanup
- Preserve historical data integrity
- Test migration on sample dataset first

## Deliverables

1. Complete source code for all three microservices
2. Database schema and migration scripts
3. API documentation
4. Setup and deployment instructions
5. Environment configuration files
6. Sample data for testing

## Additional Notes

- The legacy system was built in Microsoft Access with VBA
- Key business logic must be preserved (price calculations, prescription conversions, etc.)
- The system should feel modern and intuitive while maintaining familiarity for existing users
- Consider future enhancements: analytics dashboard, reporting, email notifications, etc.

---

**Please provide a complete, production-ready implementation following all the requirements above. The code should be well-structured, documented, and ready for deployment.**

