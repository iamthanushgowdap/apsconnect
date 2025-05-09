'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { askChatbot, type ChatbotInput, type ChatbotOutput } from '@/ai/flows/chatbot-flow';
import { useAuth } from '@/components/auth-provider';
import { getInitials } from '@/components/content/post-item-utils'; // Reusing for user initials
import { SiteConfig } from '@/config/site';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add a welcome message from the bot when the component mounts
    setMessages([
      {
        id: crypto.randomUUID(),
        text: `Hello ${user?.displayName || 'there'}! I'm ${SiteConfig.name} Assistant. How can I help you today?`,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatbotInput: ChatbotInput = { userInput: userMessage.text };
      const response: ChatbotOutput = await askChatbot(chatbotInput);
      const botMessage: Message = {
        id: crypto.randomUUID(),
        text: response.botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-2xl mx-auto bg-card shadow-xl rounded-lg border border-border">
      <div className="p-4 border-b border-border flex items-center">
        <Bot className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-lg font-semibold text-primary">{SiteConfig.name} Assistant</h2>
      </div>
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end space-x-2 ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender === 'bot' && (
              <Avatar className="h-8 w-8">
                 <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                   <Bot size={18}/>
                 </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[70%] p-3 rounded-xl shadow ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted text-muted-foreground rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70 text-left'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
             {message.sender === 'user' && user && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={ (typeof window !== 'undefined' && localStorage.getItem(`apsconnect_user_${user.uid}`)) ? JSON.parse(localStorage.getItem(`apsconnect_user_${user.uid}`) as string).avatarDataUrl : undefined } alt={user.displayName || 'User'} />
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {getInitials(user.displayName || user.email)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start space-x-2">
             <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  <Bot size={18}/>
                </AvatarFallback>
              </Avatar>
            <div className="max-w-[70%] p-3 rounded-lg shadow bg-muted text-muted-foreground rounded-bl-none">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 border-t border-border flex items-center space-x-2">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-grow text-sm"
          disabled={isLoading}
          autoFocus
        />
        <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" aria-label="Send message">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  );
}
