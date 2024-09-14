"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import AssistantContainer from '@/components/shared/assistant/AssistantContainer';
import MonacoEditor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Mic } from 'lucide-react';
import ChatBubble from '@/components/shared/ChatBubble';
type Props = {};

  function AssistantIdPage({}: Props) {
    const { isSignedIn, isLoaded } = useUser();
    const router = useRouter();
    const { theme } = useTheme();

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
      console.log('Chat created with ID:', 1);
      setChatStarted(true);
      startRecording();
    };

    const terminateInterview = () => {
      setChatStarted(false);
      setRecording(false);
      console.log('Interview terminated');
    };

    const startRecording = () => {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.start();
      setRecording(true);

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        const userMessage = { id: uuidv4(), text: transcript, isUser: true };
        setMessages((prev) => [...prev, userMessage]);

        const response = await fetchGPTResponse(transcript);
        const gptMessage = { id: uuidv4(), text: response, isUser: false };
        setMessages((prev) => [...prev, gptMessage]);

        recognition.start();
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        recognition.stop();
      };
    };

    const fetchGPTResponse = async (text: string): Promise<string> => {
      const response = await fetch('/api/gpt', {
        method: 'POST',
        body: JSON.stringify({ prompt: text }),
      });
      const data = await response.json();
      return data.reply;
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
            {/* <ChatBubble text={`this is so cool. some code is as follows:
              \`\`\`This is some code but i wonder how wide can we go but how much is the maximum though\`\`\``} isUser={false} /> */}

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