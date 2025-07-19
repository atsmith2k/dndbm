'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SessionCreationModal from '@/components/session/SessionCreationModal';
import JoinSessionModal from '@/components/session/JoinSessionModal';
import { SessionData } from '@/types/session';
import { Play, Users, Plus, LogIn, Map } from 'lucide-react';

export default function DemoPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createdSession, setCreatedSession] = useState<SessionData | null>(null);

  // Demo data
  const demoMapId = 'demo-map-1';
  const demoMapName = 'Goblin Cave';
  const demoUserId = 'demo-user-1';

  const handleSessionCreated = (session: SessionData) => {
    setCreatedSession(session);
    setShowCreateModal(false);
  };

  const handleSessionJoined = (session: SessionData) => {
    setShowJoinModal(false);
    // In a real app, navigate to the session
    window.open(`/session/${session.id}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            D&D Battle Map Creator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real-time Multiplayer Session System Demo
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              <span>Create Session</span>
            </Button>
            
            <Button
              onClick={() => setShowJoinModal(true)}
              variant="outline"
              className="flex items-center space-x-2"
              size="lg"
            >
              <LogIn className="h-5 w-5" />
              <span>Join Session</span>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Real-time Multiplayer</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Multiple players can join sessions using simple 6-character join codes. 
                See live cursors and real-time map updates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-green-600" />
                <span>Role-Based Permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Dungeon Masters have full control while Players can only move their 
                assigned characters. Clear role indicators and permission validation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Map className="h-5 w-5 text-purple-600" />
                <span>Session Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Sessions include lobby systems, participant management, automatic 
                expiration, and reconnection handling for seamless gameplay.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Created Session Display */}
        {createdSession && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Session Created Successfully!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-700">Session Name</p>
                    <p className="text-green-900">{createdSession.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Join Code</p>
                    <p className="text-2xl font-mono font-bold text-green-900">
                      {createdSession.joinCode}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => window.open(`/session/${createdSession.id}`, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Open Session
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(createdSession.joinCode);
                      alert('Join code copied to clipboard!');
                    }}
                  >
                    Copy Join Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Create a Session</h3>
                  <p className="text-gray-600">
                    Map owners can create live sessions from existing maps. A unique 6-character 
                    join code is generated automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Players Join</h3>
                  <p className="text-gray-600">
                    Players enter the join code to access the session lobby. They can see 
                    other participants and wait for the DM to start the session.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Real-time Collaboration</h3>
                  <p className="text-gray-600">
                    Once active, all participants can see real-time updates. DMs control the 
                    map while players move their assigned characters.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                  <span className="font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Session Management</h3>
                  <p className="text-gray-600">
                    DMs can manage participants, assign characters, and control session settings. 
                    Sessions automatically expire after 24 hours of inactivity.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Features */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Synchronization</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Socket.io WebSocket connections</li>
                  <li>• Optimistic updates with rollback</li>
                  <li>• Conflict resolution for simultaneous edits</li>
                  <li>• Live cursor tracking</li>
                  <li>• Automatic reconnection handling</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security & Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Role-based access control</li>
                  <li>• Server-side permission validation</li>
                  <li>• Session expiration and cleanup</li>
                  <li>• Rate limiting on join attempts</li>
                  <li>• Input sanitization and validation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SessionCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mapId={demoMapId}
        mapName={demoMapName}
        userId={demoUserId}
        onSessionCreated={handleSessionCreated}
      />

      <JoinSessionModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        userId={demoUserId}
        onSessionJoined={handleSessionJoined}
      />
    </div>
  );
}
