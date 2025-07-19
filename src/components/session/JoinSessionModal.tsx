'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Clock, Map } from 'lucide-react';
import { JoinSessionRequest, SessionData } from '@/types/session';

interface JoinSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSessionJoined?: (session: SessionData) => void;
}

interface SessionPreview {
  id: string;
  name: string;
  mapName: string;
  participantCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

export default function JoinSessionModal({
  isOpen,
  onClose,
  userId,
  onSessionJoined
}: JoinSessionModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [sessionPreview, setSessionPreview] = useState<SessionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatJoinCode = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return cleaned.slice(0, 6); // Limit to 6 characters
  };

  const handleJoinCodeChange = (value: string) => {
    const formatted = formatJoinCode(value);
    setJoinCode(formatted);
    setError(null);
    setSessionPreview(null);

    // Auto-validate when we have 6 characters
    if (formatted.length === 6) {
      validateJoinCode(formatted);
    }
  };

  const validateJoinCode = async (code: string) => {
    if (code.length !== 6) return;

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/join?code=${code}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setSessionPreview(data.session);
      } else {
        setError(data.error || 'Invalid join code');
        setSessionPreview(null);
      }
    } catch (error) {
      setError('Failed to validate join code');
      setSessionPreview(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode || joinCode.length !== 6) {
      setError('Please enter a valid 6-character join code');
      return;
    }

    if (!userId && !displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const request: JoinSessionRequest = {
        joinCode,
        ...(userId && { userId }),
        ...(displayName.trim() && { displayName: displayName.trim() })
      };

      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join session');
      }

      onSessionJoined?.(data.session);
      handleClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  const handleClose = () => {
    setJoinCode('');
    setDisplayName('');
    setSessionPreview(null);
    setError(null);
    setIsValidating(false);
    setIsJoining(false);
    onClose();
  };

  const getExpirationText = (expiresAt: string | null) => {
    if (!expiresAt) return 'No expiration set';
    
    const expiration = new Date(expiresAt);
    const now = new Date();
    const diffHours = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Expires soon';
    if (diffHours < 24) return `Expires in ${diffHours} hours`;
    return `Expires in ${Math.ceil(diffHours / 24)} days`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="join-code">Join Code</Label>
            <div className="relative">
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => handleJoinCodeChange(e.target.value)}
                placeholder="Enter 6-character code"
                className="font-mono text-center text-lg tracking-wider uppercase"
                maxLength={6}
              />
              {isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-character code provided by your DM
            </p>
          </div>

          {!userId && (
            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will be visible to other players
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sessionPreview && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3">Session Found!</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Map className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{sessionPreview.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-700">
                  <span>Map: {sessionPreview.mapName}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-green-700">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{sessionPreview.participantCount} players</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{getExpirationText(sessionPreview.expiresAt)}</span>
                  </div>
                </div>
                {!sessionPreview.isActive && (
                  <div className="text-sm text-yellow-600">
                    ⚠️ Session is currently inactive
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleJoinSession}
              disabled={
                isJoining || 
                joinCode.length !== 6 || 
                (!userId && !displayName.trim()) ||
                !sessionPreview
              }
              className="flex-1"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Session'
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Make sure you have the correct join code from your Dungeon Master. 
              Join codes are case-insensitive and expire when the session ends.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
