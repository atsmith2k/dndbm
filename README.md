# D&D Battle Map Creator

A complete, production-ready Next.js 14 application for creating and managing D&D battle maps with real-time multiplayer support.

## Features

### Core Features
- **Interactive Battle Map Editor**: Canvas-based map editing with Konva.js
- **Real-time Multiplayer**: Live sessions with Socket.io
- **Terrain Tools**: Multiple terrain types (walls, water, lava, forest, etc.)
- **Entity Management**: Place and manage players, NPCs, monsters, and objects
- **Initiative Tracking**: Built-in turn order management
- **Chat System**: Real-time chat with dice rolling
- **Import/Export**: Save and share maps as JSON files

### Technical Features
- **Next.js 14 App Router**: Modern React framework with server components
- **TypeScript**: Full type safety throughout the application
- **PostgreSQL + Prisma**: Robust database with type-safe ORM
- **Socket.io**: Real-time communication
- **Zustand**: Lightweight state management
- **Tailwind CSS + shadcn/ui**: Modern, responsive UI components
- **Production Ready**: Optimized for deployment with proper error handling

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd dnd-battle-map
npm install
```

2. **Set up environment variables**:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your database URL and other settings:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dnd_battle_map"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Set up the database**:
```bash
npm run db:push
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser**:
Navigate to `http://localhost:3000`

## Usage

### Creating a Battle Map
1. Click "New Map" from the dashboard
2. Use the toolbar to select terrain and entity tools
3. Click on the grid to place terrain or entities
4. Drag entities to move them around
5. Save your map when finished

### Starting a Live Session
1. Open a saved map in the editor
2. Click "Start Session"
3. Share the session URL with players
4. Use the initiative tracker to manage turn order
5. Chat with players in real-time

### Managing Entities
- Click entities to select and view details
- Use the entity panel to edit properties (HP, AC, etc.)
- Drag entities to move them during gameplay
- Right-click for additional options

## Development

### Project Structure
```
src/
├── app/                 # Next.js 14 App Router pages
├── components/          # React components
│   ├── ui/             # shadcn/ui base components
│   ├── battle-map/     # Map editor components
│   └── session/        # Session-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── store/              # Zustand state management
└── types/              # TypeScript type definitions
```

### Key Technologies
- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Socket.io
- **Database**: PostgreSQL, Prisma ORM
- **UI**: Tailwind CSS, shadcn/ui, Lucide React
- **Canvas**: Konva.js, react-konva
- **State**: Zustand
- **Validation**: Zod

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open Prisma Studio

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
docker build -t dnd-battle-map .
docker run -p 3000:3000 dnd-battle-map
```

### Manual Deployment
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Configure environment variables
4. Start the server: `npm start`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for authentication | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `SOCKET_PORT` | Socket.io port (development) | No |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io URL (production) | No |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

## Roadmap

- [ ] User authentication and authorization
- [ ] Advanced terrain tools and custom brushes
- [ ] Fog of war functionality
- [ ] Audio/video integration
- [ ] Mobile app companion
- [ ] Advanced dice rolling with modifiers
- [ ] Campaign management features
- [ ] Integration with D&D Beyond

---

Built with ❤️ for the D&D community
