# Portfolio Website

## Overview

This is a modern portfolio website built with a full-stack TypeScript architecture. The application showcases Jonas Petersen's professional experience, projects, and skills in a sleek, dark-themed interface. It features a React frontend with shadcn/ui components, an Express backend, and PostgreSQL database integration via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- Fixed JSX syntax error in home.tsx (> character properly escaped as &gt;)
- Created Vercel deployment configuration (vercel.json)  
- Added comprehensive README.md with setup instructions
- Created deployment guide (DEPLOYMENT.md)
- Updated .gitignore for production deployment
- Created .env.example for environment variable reference
- Prepared project for GitHub push and Vercel deployment (July 22, 2025)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite with custom configuration
- **Animations**: Framer Motion for smooth transitions

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot reload with tsx and Vite middleware integration

## Key Components

### Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Located in `shared/schema.ts` with user model
- **Migrations**: Automated via `drizzle-kit` in `./migrations` directory
- **Connection**: Neon Database serverless PostgreSQL

### Storage Interface
- **Abstraction**: `IStorage` interface in `server/storage.ts`
- **Implementation**: Memory storage for development, easily swappable for production
- **Operations**: CRUD methods for user management

### UI Components
- **Design System**: Comprehensive shadcn/ui component library
- **Theme**: Custom dark theme with orange primary color
- **Typography**: Inter font family
- **Icons**: Lucide React icons

### Authentication & Authorization
- **Session Management**: Connect-pg-simple for PostgreSQL session store
- **User Schema**: Basic user model with username/password fields
- **Validation**: Zod schemas with Drizzle integration

## Data Flow

1. **Client Requests**: React components use TanStack Query for API calls
2. **API Layer**: Express routes in `server/routes.ts` handle HTTP requests
3. **Business Logic**: Storage interface abstracts database operations
4. **Database**: Drizzle ORM manages PostgreSQL interactions
5. **Response**: JSON responses sent back to client with error handling

## External Dependencies

### Frontend Dependencies
- **UI Framework**: Radix UI primitives for accessibility
- **Utilities**: clsx, tailwind-merge for className management
- **Date Handling**: date-fns for date formatting
- **HTTP Client**: Native fetch with custom wrapper in queryClient

### Backend Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **Session Store**: connect-pg-simple for persistent sessions
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build System**: Vite for frontend, esbuild for backend
- **Type Checking**: TypeScript with strict mode enabled
- **Linting**: PostCSS with Tailwind CSS and Autoprefixer
- **Replit Integration**: Custom plugins for development environment

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR on client directory
- **Backend**: tsx with watch mode for server directory
- **Database**: Environment-based DATABASE_URL configuration

### Production Build
1. **Frontend**: `vite build` outputs to `dist/public`
2. **Backend**: `esbuild` bundles server to `dist/index.js`
3. **Static Assets**: Express serves built frontend files
4. **Database**: Drizzle migrations applied via `db:push` command

### Configuration
- **Environment**: NODE_ENV-based configuration
- **Database**: Requires DATABASE_URL environment variable
- **Sessions**: PostgreSQL-backed session storage
- **Static Files**: Served from build output directory

The architecture emphasizes type safety, developer experience, and scalability while maintaining a clean separation of concerns between frontend presentation, backend business logic, and data persistence layers.

## Deployment Configuration

### Vercel Setup
- **Configuration**: vercel.json configured for full-stack deployment
- **Build Process**: Frontend builds to dist/public, backend to dist/index.js
- **Routing**: API routes forwarded to Express backend, static files served directly
- **Environment**: Requires DATABASE_URL for PostgreSQL connection

### GitHub Repository
- **Target**: https://github.com/7jep7/jonaspetersen.com
- **Strategy**: Direct replacement of existing Remix application
- **Deployment**: Automatic Vercel deployment on main branch push
- **Domain**: jonaspetersen.com (existing custom domain configuration)