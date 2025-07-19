'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BattleMapEditor from '@/components/battle-map/BattleMapEditor';
import SessionLobby from '@/components/session/SessionLobby';
import { SessionData, Role } from '@/types/session';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId] = useState('temp-user-id'); // TODO: Get from auth
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [showLobby, setShowLobby] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found');
        }
        throw new Error('Failed to load session');
      }

      const sessionData = await response.json();
      setSession(sessionData);

      // Find current user's role
      const participant = sessionData.participants.find(
        (p: any) => p.userId === currentUserId
      );
      setUserRole(participant?.role || null);

      // Show lobby if session is not active
      setShowLobby(!sessionData.isActive);

    } catch (error) {
      console.error('Failed to load session:', error);
      setError(error instanceof Error ? error.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setSession(updatedSession);
        setShowLobby(false);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: Role) => {
    // This would be handled by the socket in a real implementation
    // TODO: Implement role update via socket
  };

  const handleKickParticipant = async (userId: string) => {
    // This would be handled by the socket in a real implementation
    // TODO: Implement participant kicking via socket
  };

  const handleLeaveSession = () => {
    if (confirm('Are you sure you want to leave this session?')) {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Session Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={loadSession} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Session not found</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is in session
  const isParticipant = session.participants.some(p => p.userId === currentUserId);

  if (!isParticipant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You are not a participant in this session. Please use the correct join code to join.
          </p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showLobby ? (
        <SessionLobby
          session={session}
          currentUserId={currentUserId}
          currentUserRole={userRole}
          onStartSession={handleStartSession}
          onUpdateRole={handleUpdateRole}
          onKickParticipant={handleKickParticipant}
          onLeaveSession={handleLeaveSession}
        />
      ) : (
        <>
          {/* Session Active Alert */}
          <Alert className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Session is now active! You can interact with the battle map.
              <Button
                variant="link"
                className="p-0 h-auto ml-2"
                onClick={() => setShowLobby(true)}
              >
                View Lobby
              </Button>
            </AlertDescription>
          </Alert>

          {/* Battle Map Editor */}
          <BattleMapEditor
            mapId={session.mapId}
            sessionId={sessionId}
            userId={currentUserId}
            session={session}
            userRole={userRole}
          />
        </>
      )}
    </div>
  );
}
