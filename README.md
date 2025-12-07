# Optometry Store Management System

Modern web application for managing customers and prescriptions for an optometry store.

## Architecture

The system consists of three microservices:
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL 15

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Running with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

### First Time Setup

1. **Start the services:**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations:**
   ```bash
   docker-compose exec backend npx prisma migrate dev --name init
   ```

3. **Generate Prisma Client:**
   ```bash
   docker-compose exec backend npx prisma generate
   ```

4. **Access Prisma Studio (optional):**
   ```bash
   docker-compose exec backend npx prisma studio
   ```

### Local Development (without Docker)

#### Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and set DATABASE_URL

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env and set VITE_API_URL

# Start development server
npm run dev
```

## Project Structure

```
.
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── api/          # API client functions
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main app component
│   ├── package.json
│   └── Dockerfile
├── backend/              # Express backend API
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Utility functions
│   │   └── index.ts      # Main server file
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── package.json
│   └── Dockerfile
├── database/             # Database initialization scripts
│   └── init.sql
├── docker-compose.yml     # Docker Compose configuration
└── README.md
```

## Features

### Customer Management
- Real-time search by ID, name, or phone
- Customer information display and editing
- Israeli ID validation with checksum
- Auto-save functionality

### Prescription Management
- Create, edit, delete prescriptions
- Duplicate/clone prescriptions
- Convert distance prescriptions to reading prescriptions
- Three types: מרחק (distance), קריאה (reading), עדשות מגע (contact lenses)
- Optical measurements: R, L, PD, Cyl, AX, ADD

### Business Logic
- Automatic price calculation based on:
  - Index value (1.5, 1.56, 1.6, etc.)
  - Discount source (מאוחדת שיא, etc.)
  - Campaign 280
- Payment tracking (amount to pay, paid, balance)
- Real-time balance calculation

### Additional Features
- PDF generation for prescriptions
- Hebrew/RTL language support
- Single-page experience (no navigation)
- Responsive design

## API Endpoints

### Customers
- `GET /api/customers/search?q={query}` - Search customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/prescriptions` - Get customer prescriptions

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions (with filters)
- `GET /api/prescriptions/:id` - Get prescription by ID
- `POST /api/prescriptions` - Create prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription
- `POST /api/prescriptions/:id/duplicate` - Duplicate prescription
- `POST /api/prescriptions/:id/convert-to-reading` - Convert to reading
- `POST /api/prescriptions/:id/calculate-price` - Recalculate price
- `POST /api/prescriptions/:id/generate-pdf` - Generate PDF

### Supporting Entities
- `GET /api/branches` - Get all branches
- `GET /api/optometrists` - Get all optometrists
- `GET /api/employees` - Get all employees
- `GET /api/campaigns` - Get all campaigns

## Database Schema

The database uses Prisma ORM with PostgreSQL. Key models:
- **Customer** - Customer information
- **Prescription** - Prescription data with optical measurements
- **Branch** - Store branches
- **Optometrist** - Optometrist information
- **Employee** - Employee information
- **Campaign** - Promotional campaigns

## Development

### Backend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio
npm run lint         # Run ESLint
```

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://optometry_user:optometry_pass@localhost:5432/optometry_db
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Verify database credentials

### Port Conflicts
- Change ports in docker-compose.yml if 3000, 3001, or 5432 are in use
- Update FRONTEND_URL and VITE_API_URL accordingly

### Prisma Issues
```bash
# Reset database (WARNING: deletes all data)
docker-compose exec backend npx prisma migrate reset

# Generate Prisma client
docker-compose exec backend npx prisma generate
```

## License

MIT

