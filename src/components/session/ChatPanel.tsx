'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessage } from '@/types/session';
import { Send, Dice6 } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

interface ChatPanelProps {
  sessionId: string;
  userId: string;
}

export default function ChatPanel({ sessionId, userId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [displayName] = useState('Player'); // TODO: Get from auth
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const socket = useSocket({
    sessionId,
    userId,
    onChatMessage: (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId,
      userId,
      displayName,
      message: newMessage,
      timestamp: new Date(),
      type: 'chat'
    };

    setMessages(prev => [...prev, message]);
    socket.emitChatMessage(message);
    setNewMessage('');
  };

  const rollDice = (sides: number = 20) => {
    const roll = Math.floor(Math.random() * sides) + 1;
    const message: ChatMessage = {
      id: `roll-${Date.now()}`,
      sessionId,
      userId,
      displayName,
      message: `rolled a d${sides}: ${roll}`,
      timestamp: new Date(),
      type: 'roll'
    };

    setMessages(prev => [...prev, message]);
    socket.emitChatMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Chat</CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto space-y-3 pb-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet.</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {message.displayName}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              
              <div className={`text-sm p-2 rounded-lg ${
                message.type === 'roll' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-700 italic'
                  : message.userId === userId
                  ? 'bg-blue-500 text-white ml-8'
                  : 'bg-gray-100 text-gray-800 mr-8'
              }`}>
                {message.type === 'roll' && (
                  <Dice6 size={14} className="inline mr-1" />
                )}
                {message.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <CardContent className="pt-3">
        <div className="space-y-2">
          {/* Quick Dice Rolls */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rollDice(20)}
              className="flex-1"
            >
              <Dice6 size={14} className="mr-1" />
              d20
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rollDice(12)}
              className="flex-1"
            >
              <Dice6 size={14} className="mr-1" />
              d12
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rollDice(10)}
              className="flex-1"
            >
              <Dice6 size={14} className="mr-1" />
              d10
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rollDice(6)}
              className="flex-1"
            >
              <Dice6 size={14} className="mr-1" />
              d6
            </Button>
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
