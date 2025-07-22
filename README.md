# Jonas Petersen - Portfolio Website

A modern, minimalistic dark-mode personal portfolio showcasing professional experience, projects, and skills. Built with a full-stack TypeScript architecture featuring React, Express.js, and PostgreSQL.

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS** with custom dark theme
- **Framer Motion** for animations
- **TanStack Query** for state management

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** with PostgreSQL
- **Neon Database** serverless PostgreSQL
- **Express sessions** with PostgreSQL store

## 🛠️ Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon Database account)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/7jep7/jonaspetersen.com.git
cd jonaspetersen.com
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with:
DATABASE_URL=your_postgresql_connection_string
```

4. Push database schema:
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📦 Deployment

### Vercel (Recommended)

This project is configured for seamless Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Add your `DATABASE_URL` environment variable in Vercel dashboard
3. Deploy automatically on push to main branch

### Build for Production

```bash
npm run build
npm start
```

## 🏗️ Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── lib/         # Utilities and configurations
│   │   ├── pages/       # Route components
│   │   └── main.tsx     # Application entry point
│   └── index.html
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data layer abstraction
│   └── vite.ts          # Vite integration
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema and types
└── public/              # Static assets
```

## 🎨 Features

- **Responsive Design**: Mobile-first approach with smooth animations
- **Dark Theme**: Custom orange accent color with professional dark mode
- **Type Safety**: Full TypeScript coverage from database to UI
- **Modern Stack**: Latest React patterns with server-side integration
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Performance**: Optimized builds with Vite and esbuild

## 🔧 Configuration

- **Database**: Configured via `drizzle.config.ts`
- **Styling**: Tailwind configuration in `tailwind.config.ts`
- **Build**: Vite configuration in `vite.config.ts`
- **TypeScript**: Strict mode enabled in `tsconfig.json`

## 📄 License

MIT License - feel free to use this project as a template for your own portfolio!