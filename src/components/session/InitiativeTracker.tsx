'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InitiativeEntry } from '@/types/battle-map';
import { Plus, SkipForward, Trash2, Edit } from 'lucide-react';

interface InitiativeTrackerProps {
  sessionId: string;
}

export default function InitiativeTracker({ sessionId }: InitiativeTrackerProps) {
  const [initiative, setInitiative] = useState<InitiativeEntry[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    entityName: '',
    initiative: 0
  });

  useEffect(() => {
    loadInitiative();
  }, [sessionId]);

  const loadInitiative = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const session = await response.json();
        setInitiative(session.initiative || []);
        setCurrentTurn(session.currentTurn || 0);
        setRound(session.round || 1);
      }
    } catch (error) {
      console.error('Failed to load initiative:', error);
    }
  };

  const addInitiativeEntry = async () => {
    if (!newEntry.entityName.trim()) return;

    const entry: InitiativeEntry = {
      id: `init-${Date.now()}`,
      entityName: newEntry.entityName,
      initiative: newEntry.initiative,
      order: initiative.length
    };

    const updatedInitiative = [...initiative, entry]
      .sort((a, b) => b.initiative - a.initiative)
      .map((item, index) => ({ ...item, order: index }));

    setInitiative(updatedInitiative);
    setNewEntry({ entityName: '', initiative: 0 });
    setIsAddDialogOpen(false);

    // TODO: Save to database and emit to other clients
  };

  const removeInitiativeEntry = (id: string) => {
    const updatedInitiative = initiative
      .filter(entry => entry.id !== id)
      .map((item, index) => ({ ...item, order: index }));
    
    setInitiative(updatedInitiative);
    
    // Adjust current turn if necessary
    if (currentTurn >= updatedInitiative.length) {
      setCurrentTurn(Math.max(0, updatedInitiative.length - 1));
    }
  };

  const nextTurn = () => {
    let newTurn = currentTurn + 1;
    let newRound = round;

    if (newTurn >= initiative.length) {
      newTurn = 0;
      newRound = round + 1;
    }

    setCurrentTurn(newTurn);
    setRound(newRound);

    // TODO: Emit to other clients
  };

  const rollInitiative = () => {
    const updatedInitiative = initiative.map(entry => ({
      ...entry,
      initiative: Math.floor(Math.random() * 20) + 1
    }))
    .sort((a, b) => b.initiative - a.initiative)
    .map((item, index) => ({ ...item, order: index }));

    setInitiative(updatedInitiative);
    setCurrentTurn(0);
    setRound(1);
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Initiative Tracker</h3>
        <div className="flex space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Initiative Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newEntry.entityName}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      entityName: e.target.value
                    })}
                    placeholder="Character/Monster name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Initiative</label>
                  <Input
                    type="number"
                    value={newEntry.initiative}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      initiative: parseInt(e.target.value) || 0
                    })}
                    placeholder="Initiative roll"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addInitiativeEntry}>
                    Add
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Round and Turn Info */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">Round {round}</div>
            {initiative.length > 0 && (
              <div className="text-sm text-gray-600 mt-1">
                Current: {initiative[currentTurn]?.entityName || 'None'}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button 
              onClick={nextTurn} 
              disabled={initiative.length === 0}
              className="flex-1"
            >
              <SkipForward size={16} className="mr-1" />
              Next Turn
            </Button>
            <Button 
              onClick={rollInitiative}
              variant="outline"
              disabled={initiative.length === 0}
            >
              Roll All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Initiative List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {initiative.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>No initiative entries yet.</p>
              <p className="text-sm mt-1">Add characters and monsters to track turn order.</p>
            </CardContent>
          </Card>
        ) : (
          initiative.map((entry, index) => (
            <Card 
              key={entry.id}
              className={`${
                index === currentTurn 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                      {entry.initiative}
                    </div>
                    <div>
                      <div className="font-medium">{entry.entityName}</div>
                      <div className="text-xs text-gray-500">
                        Initiative: {entry.initiative}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInitiativeEntry(entry.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
