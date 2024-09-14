"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import AssistantContainer from '@/components/shared/assistant/AssistantContainer';
import MonacoEditor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Mic } from 'lucide-react';
import ChatBubble from '@/components/shared/ChatBubble';
import { useMutation, useQuery } from 'convex/react';  // Import the mutation hook from Convex
import { api } from "@/convex/_generated/api";

type Props = {};
const OPENAI_API_KEY = 'sk-proj-hLV75aM8KFxGPI0SFnh8T3BlbkFJrgxRD2lG9BhxYWLRzR9p';

function AssistantIdPage({}: Props) {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const { theme } = useTheme();
  // const createInterview = useMutation(api.interview.create);

  // Convex mutation hook to store messages
  const storeMessageMutation = useMutation(api.messages.storeMessage);
  // Extract the ID from the URL
  const path = usePathname();
  const id = path.split('/assistant/')[1];
  const fetchInterviewData = useQuery(api.interview.getInterviewData, { id });
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/assistant');
    }
  }, [isSignedIn, isLoaded, router]);

  const [chatStarted, setChatStarted] = useState(false);
  const [code, setCode] = useState('// Write your code here');
  const [messages, setMessages] = useState<{ id: string; text: string; isUser: boolean }[]>([]);
  const [recording, setRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const startInterview = async () => {
    console.log('Chat created with ID:', id);
    setChatStarted(true);
    if (user) {
      await createInterview({
        clerkId: user.id,
        interviewType: 'technical',
        difficulty: 'medium',
        language: 'javascript',
        duration: 60,
        keyConcepts: ['async', 'await', 'promises'],
      });
    }
    startRecording();
  };

  const terminateInterview = () => {
    setChatStarted(false);
    setRecording(false);
    console.log('Interview terminated');
  };

  // Silence detection time in milliseconds
  const SILENCE_TIMEOUT = 5000;
  
  const startRecording = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    let silenceTimer: NodeJS.Timeout | null = null;

    const resetSilenceTimer = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      silenceTimer = setTimeout(() => {
        recognition.stop(); // Stop after 5 seconds of silence
        setRecording(false);
        console.log('Stopped recording due to silence');
      }, SILENCE_TIMEOUT);
    };
    
    recognition.start();
    setRecording(true);
    
    recognition.onresult = async (event) => {
      resetSilenceTimer(); // Reset the silence timer every time there's a result
      const transcript = event.results[0][0].transcript;
      const userMessage = { id: id, text: transcript, isUser: true };
      setMessages((prev) => [...prev, userMessage]);

      const response = await fetchGPTResponse(transcript);
      const gptMessage = { id: id, text: response, isUser: false };
      setMessages((prev) => [...prev, gptMessage]);

      await storeMessageMutation(userMessage);
      await storeMessageMutation(gptMessage);
      await fetchInterviewData.refetch(); // Refetch the interview data
      resetSilenceTimer();
    };

    recognition.onspeechstart = () => {
      console.log('Speech detected, resetting silence timer.');
      resetSilenceTimer();
    };
    
    recognition.onspeechend = () => {
      console.log('Speech ended, waiting for silence.');
      resetSilenceTimer();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      recognition.stop();
    };

    recognition.onend = () => {
      if (recording) {
        console.log('Restarting recognition due to end of session');
        recognition.start(); // Restart recognition after session ends unless manually stopped
      }
    };
  };

  const fetchGPTResponse = async (text: string): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`, // API key for OpenAI
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Using the fast 'gpt-3.5-turbo' model
        messages: [{ role: 'user', content: text }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  };

  return (
    <AssistantContainer>
      <div className="relative h-full w-full flex flex-col">
        <div
          className="relative overflow-y-scroll p-4 h-64 border-2 rounded-lg"
          ref={chatContainerRef}
          >
          {messages.map((message) => (
            <ChatBubble key={message.id} text={message.text} isUser={message.isUser} />
          ))}

          {!chatStarted && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <button
                  onClick={startInterview}
                  className="w-16 h-16 bg-blue-500 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-400"
                >
                  <Mic size={32} />
                </button>
                <p className="mt-2 text-lg text-gray-700">Begin Session</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-grow mt-4">
          <MonacoEditor
            height="100%"
            language="javascript"
            theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
            value={code}
            options={{
              readOnly: !chatStarted,
            }}
            onChange={(value) => setCode(value || '')}
          />
        </div>
      </div>
    </AssistantContainer>
  );
}

export default AssistantIdPage;
