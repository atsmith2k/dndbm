'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreateSessionRequest, SessionData } from '@/types/session';

interface SessionCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapId: string;
  mapName: string;
  userId: string;
  onSessionCreated?: (session: SessionData) => void;
}

export default function SessionCreationModal({
  isOpen,
  onClose,
  mapId,
  mapName,
  userId,
  onSessionCreated
}: SessionCreationModalProps) {
  const [sessionName, setSessionName] = useState(`Session for ${mapName}`);
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [isCreating, setIsCreating] = useState(false);
  const [createdSession, setCreatedSession] = useState<SessionData | null>(null);
  const [joinCodeCopied, setJoinCodeCopied] = useState(false);

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const request: CreateSessionRequest = {
        name: sessionName,
        mapId,
        userId,
        ...(expirationDate && { expiresAt: expirationDate })
      };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const session = await response.json();
      setCreatedSession(session);
      onSessionCreated?.(session);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyJoinCode = async () => {
    if (createdSession?.joinCode) {
      await navigator.clipboard.writeText(createdSession.joinCode);
      setJoinCodeCopied(true);
      setTimeout(() => setJoinCodeCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setCreatedSession(null);
    setSessionName(`Session for ${mapName}`);
    setExpirationDate(undefined);
    setJoinCodeCopied(false);
    onClose();
  };

  if (createdSession) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Session Created Successfully!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Share this join code with your players:
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-2xl font-bold tracking-wider">
                  {createdSession.joinCode}
                </div>
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
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Session Details</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Name:</strong> {createdSession.name}</p>
                <p><strong>Map:</strong> {mapName}</p>
                {createdSession.expiresAt && (
                  <p><strong>Expires:</strong> {format(new Date(createdSession.expiresAt), 'PPP p')}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => window.open(`/session/${createdSession.id}`, '_blank')}
                className="flex-1"
              >
                Open Session
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name"
            />
          </div>

          <div>
            <Label>Map</Label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{mapName}</p>
              <p className="text-sm text-gray-600">Selected map for this session</p>
            </div>
          </div>

          <div>
            <Label>Session Expiration (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? format(expirationDate, "PPP p") : "Select expiration date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500 mt-1">
              If not set, session will expire after 24 hours of inactivity
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You will be assigned as the Dungeon Master (DM) with full control over the session.
              Players can join using the generated join code.
            </p>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleCreateSession} 
              disabled={isCreating || !sessionName.trim()}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Session'}
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
