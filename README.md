# Mortgage Quote System

A real-time mortgage quote system where buyers can submit quote requests and receive offers from lenders. Built with Next.js 13, Prisma, SQLite, and Socket.io.

## Features

- 🏠 Buyers can submit mortgage quote requests
- 💰 Lenders can review and submit quotes
- 💬 Real-time chat between buyers and lenders
- 🤖 AI-powered automated quotes
- 📊 Dashboard for managing quotes and requests
- 🔐 Role-based authentication (Admin, Lender, Buyer)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd homebuyers
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Generate a secure secret for NextAuth
   # On Windows PowerShell:
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   # On Unix-based systems:
   openssl rand -base64 32
   
   # Update .env with your values
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Create database and run migrations
   npx prisma migrate dev
   
   # Seed the database with test data
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   # Start the Next.js development server
   npm run dev
   ```

## Development Commands

### Database Management
```bash
# Reset database (drops all tables and recreates)
npx prisma migrate reset

# Create a new migration after schema changes
npx prisma migrate dev --name <migration-name>

# Apply migrations without recreating database
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Run TypeScript compiler
npm run type-check
```

### Building for Production
```bash
# Create production build
npm run build

# Start production server
npm start
```

## Project Structure

```
homebuyers/
├── app/                    # Next.js 13 app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components
│   └── quote-wizard/     # Quote wizard components
├── lib/                  # Utility functions and configs
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── styles/              # Global styles
└── types/               # TypeScript type definitions
```

## Environment Variables

Required environment variables (see `.env.example` for all options):

- `DATABASE_URL`: SQLite database URL
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `NEXTAUTH_URL`: Your application URL
- `ADMIN_REGISTRATION_CODE`: Code for admin registration
- `LENDER_CODE`: Code for lender registration
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `ANTHROPIC_API_KEY`: Anthropic API key for AI features

## Common Issues & Solutions

### Database Reset
If you need to completely reset the database:
```bash
# Delete the database file
rm prisma/dev.db
# Reset Prisma's migration history
npx prisma migrate reset
```

### Seeding Issues
If you encounter seeding errors:
```bash
# Reset the database and reseed
npx prisma migrate reset
# Or manually run the seed
npx prisma db seed
```

### Authentication Issues
- Ensure all environment variables are set correctly
- Check that the database migrations are up to date
- Verify the registration codes in your .env file

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT License - see LICENSE file for details 