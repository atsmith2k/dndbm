'use client';

import React, { useEffect, useState } from 'react';
import BattleMapEditor from '@/components/battle-map/BattleMapEditor';
import InitiativeTracker from '@/components/session/InitiativeTracker';
import ChatPanel from '@/components/session/ChatPanel';
import { SessionWithRelations } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Play, Pause, RotateCcw } from 'lucide-react';

interface SessionPageProps {
  params: {
    id: string;
  };
}

export default function SessionPage({ params }: SessionPageProps) {
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For demo purposes, using a temporary user ID
  const userId = 'temp-user-id';

  useEffect(() => {
    loadSession();
  }, [params.id]);

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${params.id}`);
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
      } else {
        setError('Session not found');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setError('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !session.isActive })
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to toggle session:', error);
    }
  };

  const resetSession = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTurn: 0, round: 1 })
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error || 'Session not found'}</p>
            <Button onClick={() => window.location.href = '/'}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Session Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{session.name}</h1>
            <p className="text-sm text-gray-600">
              Map: {session.map.name} • Round {session.round} • 
              <span className={`ml-1 ${session.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {session.isActive ? 'Active' : 'Paused'}
              </span>
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm text-gray-600">
              <Users size={16} className="mr-1" />
              {session.participants.length} participants
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSession}
            >
              {session.isActive ? (
                <>
                  <Pause size={16} className="mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play size={16} className="mr-1" />
                  Resume
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetSession}
            >
              <RotateCcw size={16} className="mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Initiative Tracker */}
        <div className="w-80 bg-white border-r border-gray-200">
          <InitiativeTracker sessionId={session.id} />
        </div>

        {/* Center - Battle Map */}
        <div className="flex-1">
          <BattleMapEditor 
            mapId={session.map.id}
            sessionId={session.id}
            userId={userId}
          />
        </div>

        {/* Right Sidebar - Chat */}
        <div className="w-80 bg-white border-l border-gray-200">
          <ChatPanel sessionId={session.id} userId={userId} />
        </div>
      </div>
    </div>
  );
}
