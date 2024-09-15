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
import textToSpeech from '@google-cloud/text-to-speech';

type Props = {};

function AssistantIdPage({ }: Props) {
  const { isSignedIn, isLoaded, user } = useUser();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecording(false);
  };

  const router = useRouter();
  const { theme } = useTheme();
  const createInterview = useMutation(api.interview.create);
  const storeMessageMutation = useMutation(api.messages.storeMessage);
  const path = usePathname();
  const ourId = path.split('/assistant/')[1];
  const fetchInterviewData = useQuery(api.interview.getInterviewData, {
    id: ourId,
  });
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
    if (recording) {
      console.log('Recording already started');
      return;
    } 
    setRecording(true);

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  
    let silenceTimer: NodeJS.Timeout | null = null;
    const SESSION_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds
    const SILENCE_TIMEOUT = 5000; // 5 seconds of silence before stopping
  
    // Start a session timer to stop after 20 minutes
    const sessionTimer = setTimeout(() => {
      recognition.stop();
      setRecording(false);
    }, SESSION_DURATION);
  
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
      const userMessage = { id: ourId, text: transcript, isUser: true };
      setMessages((prev) => [...prev, userMessage]);
  
      stopRecording();
      const response = await fetchGPTResponse(transcript);
      const gptMessage = { id: ourId, text: response, isUser: false };
      setMessages((prev) => [...prev, gptMessage]);
      stopRecording();
      await storeMessageMutation(userMessage);
      await storeMessageMutation(gptMessage);
      resetSilenceTimer();
    };
  
    recognition.onspeechstart = () => {
      resetSilenceTimer(); // Reset the silence timer when the user starts talking
    };
  
    recognition.onspeechend = () => {
      resetSilenceTimer(); // Handle the end of user speech
    };
  
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      recognition.stop(); // Stop on error, but this will automatically restart if `onend` is handled properly
    };
  
    recognition.onend = () => {
      if (recording) {
        recognition.start(); // Restart recognition if still recording
      } else {
        clearTimeout(sessionTimer); // Clear the session timer when the conversation is over
      }
    };
  };
  
  const playAudioInBrowser = (audioContent: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
    audio.play();
    audio.onended = () => {
      startRecording();
    };
  };
  
  const convertTextToSpeech = async (text: string) => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
    
      const requestBody = {
        audioConfig: {
          audioEncoding: "MP3",
          pitch: 1,
          speakingRate: 1.15,
        },
        input: {
          text: text,
        },
        voice: {
          languageCode: "en-US",
          name: "en-US-Polyglot-1",
        },
      };
    
      try {
        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );
    
        const data = await response.json();
    
        if (data.audioContent) {
          playAudioInBrowser(data.audioContent);
        } else {
          console.error("Audio content not found in the response.");
        }
      } catch (error) {
        console.error("Error converting text to speech:", error);
      }      
  }
  
  const fetchGPTResponse = async (text: string): Promise<string> => {
    setRecording(true);
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  
    const temperature = fetchInterviewData?.interviewType === 'technical' ? 0.4 : (fetchInterviewData?.interviewType === 'behavioral' ? 0.6 : 0.7);
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: fetchInterviewData?.interviewType === 'technical'
            ? `You are an interviewer conducting a technical interview. Ask a coding or algorithm-related questions, and ensure they are ${fetchInterviewData?.difficulty} difficulty. Focus on the following key concepts: ${fetchInterviewData?.keyConcepts.join(', ')}. Make sure if you ask a coding question, then it is surrounded by three back ticks.`
            : `You are an interviewer conducting a behavioral interview. Ask an open-ended question that evaluate the user’s past experiences, leadership, and problem-solving skills in the workplace.`
        },
        { role: 'user', content: text }
      ],
      temperature: temperature,
    });
  
    const gptResponse = response.choices[0].message.content;
  
    await convertTextToSpeech(gptResponse);
    setRecording(false);
    return gptResponse;
  };

  return (
    <AssistantContainer>
      <div className="relative h-full w-full flex flex-col">
        <div
          className={`relative overflow-y-scroll p-4 ${
            fetchInterviewData?.interviewType === 'technical' ? 'h-64' : 'flex-grow'
          } border-2 rounded-lg`}
          ref={chatContainerRef}
        >
          {messages.map((message, index) => (
            <ChatBubble key={index} text={message.text} isUser={message.isUser} />
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
        {fetchInterviewData?.interviewType === 'technical' && (
          <div className="flex-grow mt-4">
            <MonacoEditor
              height="100%"
              language={fetchInterviewData?.language}
              theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
              value={code}
              options={{
                readOnly: !chatStarted,
              }}
              onChange={(value) => setCode(value || '')}
            />
          </div>
        )}
      </div>
    </AssistantContainer>
  );
}

export default AssistantIdPage;
