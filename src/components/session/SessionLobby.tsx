'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Copy, 
  Check, 
  Users, 
  Map, 
  Clock, 
  Settings,
  Crown,
  User as UserIcon
} from 'lucide-react';
import { SessionData, SessionParticipant, Role } from '@/types/session';
import { useSessionPermissions } from '@/hooks/useSessionPermissions';
import ParticipantList from './ParticipantList';

interface SessionLobbyProps {
  session: SessionData;
  currentUserId: string;
  currentUserRole: Role | null;
  onStartSession?: () => void;
  onUpdateRole?: (userId: string, newRole: Role) => void;
  onKickParticipant?: (userId: string) => void;
  onLeaveSession?: () => void;
}

export default function SessionLobby({
  session,
  currentUserId,
  currentUserRole,
  onStartSession,
  onUpdateRole,
  onKickParticipant,
  onLeaveSession
}: SessionLobbyProps) {
  const [joinCodeCopied, setJoinCodeCopied] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('');

  const { permissions, isDM } = useSessionPermissions({ 
    userRole: currentUserRole 
  });

  // Update expiry countdown
  useEffect(() => {
    if (!session.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const expiry = new Date(session.expiresAt!);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilExpiry('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeUntilExpiry(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilExpiry(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session.expiresAt]);

  const handleCopyJoinCode = async () => {
    await navigator.clipboard.writeText(session.joinCode);
    setJoinCodeCopied(true);
    setTimeout(() => setJoinCodeCopied(false), 2000);
  };

  const handleStartSession = () => {
    if (onStartSession && permissions.canControlSession) {
      onStartSession();
    }
  };

  const getSessionStatus = () => {
    if (session.isActive) {
      return { text: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { text: 'Waiting', color: 'bg-yellow-100 text-yellow-800' };
  };

  const status = getSessionStatus();
  const connectedParticipants = session.participants.filter(p => p.isConnected);
  const hasMinimumParticipants = session.participants.length >= 1; // At least DM

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{session.name}</CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={status.color}>
                  {status.text}
                </Badge>
                <div className="flex items-center text-sm text-gray-600">
                  <Map className="h-4 w-4 mr-1" />
                  {session.map?.name || 'Loading map...'}
                </div>
                {session.expiresAt && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    Expires in {timeUntilExpiry}
                  </div>
                )}
              </div>
            </div>
            
            {isDM && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJoinCode}
                  className="flex items-center space-x-1"
                >
                  {joinCodeCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleStartSession}
                  disabled={!hasMinimumParticipants || session.isActive}
                  className="flex items-center space-x-1"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Session</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Join Code Display */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Join Code</p>
                <p className="font-mono text-2xl font-bold tracking-wider">
                  {session.joinCode}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleCopyJoinCode}
                className="flex items-center space-x-1"
              >
                {joinCodeCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share this code with players to let them join the session
            </p>
          </div>

          {/* Session Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Participants</p>
              <p className="text-lg font-bold text-blue-700">
                {connectedParticipants.length}/{session.participants.length}
              </p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Crown className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-sm font-medium text-green-900">Dungeon Masters</p>
              <p className="text-lg font-bold text-green-700">
                {session.participants.filter(p => p.role === 'DM').length}
              </p>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <UserIcon className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-sm font-medium text-purple-900">Players</p>
              <p className="text-lg font-bold text-purple-700">
                {session.participants.filter(p => p.role === 'PLAYER').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {!session.isActive && isDM && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            You can start the session when ready. Players will be able to interact with the map once the session begins.
          </AlertDescription>
        </Alert>
      )}

      {!session.isActive && !isDM && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Waiting for the Dungeon Master to start the session. You'll be notified when it begins.
          </AlertDescription>
        </Alert>
      )}

      {session.isActive && (
        <Alert>
          <Play className="h-4 w-4" />
          <AlertDescription>
            Session is active! You can now interact with the battle map.
          </AlertDescription>
        </Alert>
      )}

      {/* Participants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ParticipantList
            participants={session.participants}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onUpdateRole={onUpdateRole}
            onKickParticipant={onKickParticipant}
          />
        </div>

        {/* Session Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isDM ? (
                <>
                  <Button
                    onClick={handleStartSession}
                    disabled={!hasMinimumParticipants || session.isActive}
                    className="w-full"
                    variant={session.isActive ? "outline" : "default"}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {session.isActive ? 'Session Active' : 'Start Session'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // TODO: Open session settings modal
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Session Settings
                  </Button>
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Only the DM can control the session</p>
                </div>
              )}
              
              <Button
                variant="destructive"
                className="w-full"
                onClick={onLeaveSession}
              >
                Leave Session
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(session.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Activity:</span>
                <span>{new Date(session.lastActivity).toLocaleTimeString()}</span>
              </div>
              {session.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span>{timeUntilExpiry}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
