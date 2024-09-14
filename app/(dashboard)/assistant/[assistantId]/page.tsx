"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import AssistantContainer from '@/components/shared/assistant/AssistantContainer';
import MonacoEditor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Mic } from 'lucide-react';
import ChatBubble from '@/components/shared/ChatBubble';
import { useMutation, useQuery } from 'convex/react';
import { api } from "@/convex/_generated/api";
import { OpenAI } from 'openai';

type Props = {};

function AssistantIdPage({}: Props) {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const { theme } = useTheme();
  const createInterview = useMutation(api.interview.create);
  const storeMessageMutation = useMutation(api.messages.storeMessage);
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
  };

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
        recognition.stop();
        setRecording(false);
      }, SILENCE_TIMEOUT);
    };

    recognition.start();
    setRecording(true);

    recognition.onresult = async (event) => {
      resetSilenceTimer();
      const transcript = event.results[0][0].transcript;
      const userMessage = { id: id, text: transcript, isUser: true };
      setMessages((prev) => [...prev, userMessage]);

      const response = await fetchGPTResponse(transcript);
      const gptMessage = { id: id, text: response, isUser: false };
      setMessages((prev) => [...prev, gptMessage]);

      await storeMessageMutation(userMessage);
      await storeMessageMutation(gptMessage);

      startRecording(); // Restart recording after GPT response is done
      resetSilenceTimer();
    };

    recognition.onspeechstart = () => {
      resetSilenceTimer();
    };

    recognition.onspeechend = () => {
      resetSilenceTimer();
    };

    recognition.onerror = (event) => {
      recognition.stop();
    };

    recognition.onend = () => {
      if (recording) {
        recognition.start();
      }
    };
  };
  const fetchGPTResponse = async (text: string): Promise<string> => {
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: text }],
      temperature: 0.7,
    });
  
    return response.choices[0].message.content;
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
