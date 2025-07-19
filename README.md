# D&D Battle Map Creator

A complete, production-ready Next.js 14 application for creating and managing D&D battle maps with comprehensive real-time multiplayer support.

## Features

### Core Features
- **Interactive Battle Map Editor**: Canvas-based map editing with Konva.js
- **Real-time Multiplayer**: Live sessions with Socket.io and role-based permissions
- **Session Management**: Join codes, lobbies, and participant management
- **Role-Based Access Control**: DM vs Player permissions with UI indicators
- **Terrain Tools**: Multiple terrain types (walls, water, lava, forest, etc.)
- **Entity Management**: Place and manage players, NPCs, monsters, and objects
- **Initiative Tracking**: Built-in turn order management
- **Chat System**: Real-time chat with dice rolling
- **Import/Export**: Save and share maps as JSON files

### Multiplayer Session System
- **Join Code System**: 6-character alphanumeric codes for easy session access
- **Session Persistence**: Maintains state during temporary disconnections
- **Session Expiration**: Automatic cleanup after 24 hours of inactivity
- **User Presence**: Live cursors and connection status indicators
- **Conflict Resolution**: Handles simultaneous edits with optimistic updates
- **Mobile Responsive**: Touch-friendly interface for players on phones/tablets

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

### Demo the Session System
Visit `/demo` to experience the full multiplayer functionality:
- Create sessions from demo maps
- Join sessions using 6-character codes
- Experience role-based permissions
- Test real-time synchronization

### Creating a Battle Map
1. Click "New Map" from the dashboard
2. Use the toolbar to select terrain and entity tools
3. Click on the grid to place terrain or entities
4. Drag entities to move them around
5. Save your map when finished

### Creating a Multiplayer Session
1. Open a saved map in the editor
2. Click "Start Session" to create a live session
3. A unique 6-character join code is generated
4. Share the join code with your players
5. Manage participants in the session lobby
6. Assign player characters and roles
7. Start the session when everyone is ready

### Joining a Session as a Player
1. Get the join code from your Dungeon Master
2. Visit the join session interface
3. Enter the 6-character code
4. Provide a display name
5. Wait in the lobby for the session to start
6. Interact with the map based on your assigned role

### Role-Based Permissions
- **Dungeon Master (DM)**: Full control over the map, can move any entity, modify terrain, manage participants
- **Player**: Can only move assigned character tokens, view-only access to other elements
- **Observer**: Can view the session but cannot make changes

### Session Management Features
- **Live Participant List**: See who's connected and their roles
- **Real-time Cursors**: Track other users' mouse movements
- **Permission Validation**: Server-side enforcement of role restrictions
- **Automatic Reconnection**: Seamless recovery from network issues
- **Session Expiration**: Automatic cleanup after 24 hours of inactivity

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
