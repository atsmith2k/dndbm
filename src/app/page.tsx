'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Map, Users, Play, Search, Calendar } from 'lucide-react';

interface BattleMap {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Session {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  map: {
    name: string;
  };
}

export default function HomePage() {
  const [maps, setMaps] = useState<BattleMap[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mapsResponse, sessionsResponse] = await Promise.all([
        fetch('/api/maps'),
        fetch('/api/sessions')
      ]);

      if (mapsResponse.ok) {
        const mapsData = await mapsResponse.json();
        setMaps(mapsData);
      }

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaps = maps.filter(map =>
    map.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    map.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSessions = sessions.filter(session => session.isActive);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                D&D Battle Map Creator
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage battle maps for your campaigns
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/editor">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus size={20} className="mr-2" />
                  New Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Maps</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maps.length}</div>
              <p className="text-xs text-muted-foreground">
                Battle maps created
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <p className="text-xs text-muted-foreground">
                Sessions created
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.map((session) => (
                <Card key={session.id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Play size={16} className="mr-2 text-green-600" />
                      {session.name}
                    </CardTitle>
                    <CardDescription>
                      Map: {session.map.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/session/${session.id}`}>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Join Session
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Maps Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Battle Maps
            </h2>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search maps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          {filteredMaps.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Map size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No maps found' : 'No maps yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Create your first battle map to get started'
                  }
                </p>
                {!searchTerm && (
                  <Link href="/editor">
                    <Button>
                      <Plus size={16} className="mr-2" />
                      Create Map
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaps.map((map) => (
                <Card key={map.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{map.name}</CardTitle>
                    <CardDescription>
                      {map.description || `${map.width}×${map.height} grid`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-500">
                        Created {new Date(map.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        by {map.owner.name || map.owner.email}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link href={`/editor/${map.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        className="flex-1"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/sessions', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ mapId: map.id })
                            });
                            
                            if (response.ok) {
                              const session = await response.json();
                              window.open(`/session/${session.id}`, '_blank');
                            }
                          } catch (error) {
                            console.error('Failed to start session:', error);
                          }
                        }}
                      >
                        <Play size={16} className="mr-1" />
                        Play
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
