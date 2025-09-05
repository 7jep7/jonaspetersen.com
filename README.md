
# Bass-T — Audio Engineer & Producer

Professional, clean, and modern portfolio website for Bass-T.

**Services:**
- Mixing
- Mastering
- Producing
- Beatmaking
- DJ Services

**For artists, advertisers, and event organizers.**

**Portfolio highlights:**
- [Astra Rakete (Masl, Skyden)](https://open.spotify.com/track/1SNt5TkIJhdgjkOD00ezP8?si=84d349faacc14c43) — 500,000+ listens
- [Tim River: Feel the tension](https://open.spotify.com/track/0DAc0jmbnfuUTaTqfmFnlL)
- [LionKloud: Harmony](https://open.spotify.com/track/6eYPukivyvDEoCiHrAz6Ld)
- [House of Amani: Uthando](https://open.spotify.com/track/5Whh2yubxjPKTxFZfctCzF?si=Ks82hqHRQii0PnuElOjeog)

**Contact for professional audio projects.**

Spotify: [Bass-T](https://open.spotify.com/artist/40j4uphVTGSVb4EUtLbZ2l)
YouTube: [@bass-t](https://www.youtube.com/@bass-t)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - Reusable component library
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful icon library
- **Animations**: [Framer Motion](https://www.framer.com/motion/) - Production-ready animations
- **Deployment**: [Vercel](https://vercel.com/) - Seamless deployment platform
- **TypeScript**: Full type safety throughout the application

## 🏗️ Project Structure

```
app/
├── components/ui/          # Reusable UI components (Button, Card, Badge)
├── lib/                    # Utility functions (cn helper)
├── routes/                 # Remix routes
│   ├── _index.tsx         # Homepage with portfolio content
│   └── $.tsx              # 404 error page
├── entry.client.tsx       # Client-side entry point
├── entry.server.tsx       # Server-side entry point
├── root.tsx               # Root layout component
└── tailwind.css           # Global styles and theme
```

## 🚀 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/7jep7/jonaspetersen.com.git
cd jonaspetersen.com

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the site locally.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production server
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint code linting
```

## 📦 Deployment

### Vercel (Recommended)

The site is optimized for Vercel deployment:

```bash
# Build and deploy
npm run build
```

Custom `vercel.json` configuration ensures proper build output and routing.

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy the following directories:
# - build/server (server-side code)
# - build/client (client-side assets)
```

## 🎨 Design System

### Color Palette
- **Primary Orange**: `orange-500` (#f97316) - Main brand color
- **Light Orange**: `orange-400` (#fb923c) - Gradients and accents  
- **Dark Orange**: `orange-600` (#ea580c) - Hover states and emphasis
- **Gray Scale**: `gray-900` to `gray-300` - Background and text hierarchy

### Typography
- **Headings**: Bold, large scale with tight tracking
- **Body Text**: Clean, readable with proper line-height
- **Gradient Text**: Eye-catching hero title with orange gradient

## 📋 Featured Projects

1. **human2robot** - Training data platform for robotic intelligence (Featured)
2. **K2 AI** - AI startup scaled to €500k revenue  
3. **RL Projects** - Reinforcement learning implementations
4. **Wildfire Suppression** - Published research with MCTS optimization
5. **Biomechanical Exoskeleton** - Arduino-based medical device
6. **Stratosphere Photography** - High-altitude imaging project

## 🤝 Contributing

This is a personal portfolio, but feedback and suggestions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

© 2025 Jonas Petersen. All rights reserved.

## 📬 Contact

- **Website**: [jonaspetersen.com](https://jonaspetersen.com)
- **LinkedIn**: [linkedin.com/in/jep7](https://linkedin.com/in/jep7)
- **GitHub**: [github.com/7jep7](https://github.com/7jep7)
- **Email**: Available on website

---

*Building the future of human-robot interaction, one data pipeline at a time.* 🤖
