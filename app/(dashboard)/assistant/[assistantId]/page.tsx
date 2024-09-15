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
import { Id } from '@/convex/_generated/dataModel';

type Props = {};

function AssistantIdPage({ }: Props) {
  const { isSignedIn, isLoaded, user } = useUser();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const CODE_CHANGE_TIMEOUT = 10000; // 30 seconds

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
  const ourId = path.split('/assistant/')[1] as Id<"interviews">;
  const [lastGptTimestamp, setLastGptTimestamp] = useState(null);
  const fetchInterviewData = useQuery(api.interview.getInterviewData, {
    id: ourId,
  });
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/assistant');
    }
  }, [isSignedIn, isLoaded, router]);

  const [chatStarted, setChatStarted] = useState(false);
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState<{ id: string; text: string; isUser: boolean }[]>([]);
  const [recording, setRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const codeChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // const provideHint = async () => {
  //   setMessages((prevMessages) => {
  //     // const lastMessage = prevMessages[prevMessages.length - 1];

  //     // if (!lastMessage?.isUser) {
  //     //   console.log("Last message was not from a user. Skipping provideHint.");
  //     //   return prevMessages;
  //     // }

  //     const now = Date.now();
  //     if (lastGptTimestamp && now - lastGptTimestamp < 15000) {
  //       console.log("It hasn't been 15 seconds since the last GPT message. Skipping provideHint.");
  //       return prevMessages;
  //     }

  //     const hintMessage = "It looks like you might be struggling. Here's a subtle hint to help you out.";
  //     const gptMessage = { id: ourId, text: hintMessage, isUser: false };
  //     const updatedMessages = [...prevMessages, gptMessage];

  //     (async () => {
  //       const response = await fetchGPTResponse(hintMessage);
  //       const gptResponseMessage = { id: ourId, text: response, isUser: false };
  //       setMessages((prev) => [...prev, gptResponseMessage]);
  //       await storeMessageMutation(gptMessage);
  //       await storeMessageMutation(gptResponseMessage);
  //       setLastGptTimestamp(Date.now());
  //     })();

  //     return updatedMessages;
  //   });
  // };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (codeChangeTimerRef.current) {
      clearTimeout(codeChangeTimerRef.current);
    }
    codeChangeTimerRef.current = setTimeout(() => {
      // provideHint();
    }, CODE_CHANGE_TIMEOUT);
  };

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

  const SILENCE_TIMEOUT = 20000;

  const startRecording = () => {
    if (recording) {
      console.log('Recording already started');
      return;
    }
    setRecording(true);

    const recognition = new ((window as any).SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    let silenceTimer: NodeJS.Timeout | null = null;
    let sessionTimer: NodeJS.Timeout | null = null;
    let isProcessing = false;
    const SESSION_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds

    const startSessionTimer = () => {
      sessionTimer = setTimeout(() => {
        recognition.stop();
        setRecording(false);
      }, SESSION_DURATION);
    };

    // Start a session timer to stop after 20 minutes

    const startSilenceTimer = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      silenceTimer = setTimeout(() => {
        recognition.stop();
        setRecording(false);
      }, SILENCE_TIMEOUT);
    };

    const resetSilenceTimer = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
    };

    recognition.start();
    setRecording(true);
    startSessionTimer();
    
    recognition.onresult = async (event) => {
      if (isProcessing) return;
      isProcessing = true;
      resetSilenceTimer();
      const transcript = event.results[0][0].transcript;
      const userMessage = { id: ourId, text: transcript, isUser: true };
      setMessages((prev) => [...prev, userMessage]);

      /// my line to delete below
      recognition.stop()
      setRecording(false);
      const response = await fetchGPTResponse(transcript);
      const gptMessage = { id: ourId, text: response, isUser: false };
      setMessages((prev) => [...prev, gptMessage]);
      // stopRecording();
      await storeMessageMutation(userMessage);
      await storeMessageMutation(gptMessage);
      resetSilenceTimer();
      isProcessing = false;
    };

    recognition.onspeechstart = () => {
      resetSilenceTimer(); // Reset the silence timer when the user starts talking, with a 500ms delay
    };

    recognition.onspeechend = () => {
      startSilenceTimer(); // Start the silence timer after speech ends, with a 500ms delay
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      recognition.stop(); // Stop on error, but this will automatically restart if `onend` is handled properly
    };

    recognition.onend = () => {
      if (recording) {
        recognition.start(); // Restart recognition if still recording
      } else {
        if (sessionTimer) {
          clearTimeout(sessionTimer); // Clear the session timer when the conversation is over
        }
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
    let filteredText = text.replace(/```[\s\S]*?```/g, '');
    filteredText = filteredText.replace(/`([^`]+)`/g, '$1');
    const requestBody = {
      audioConfig: {
        audioEncoding: "MP3",
        pitch: 1,
        speakingRate: 1.15,
      },
      input: {
        text: filteredText,
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

    const conversationHistory = messages.map((message) => ({
      role: message.isUser ? "user" : "assistant",
      content: message.text,
    }));
    
    conversationHistory.push({ role: "user", content: text });

    const temperature = fetchInterviewData?.interviewType === 'technical' ? 0.5 : (fetchInterviewData?.interviewType === 'behavioral' ? 0.6 : 0.7);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: fetchInterviewData?.interviewType === 'technical'
            ? `You are an interviewer conducting a technical interview in ${fetchInterviewData?.language}. Ask a coding or algorithm-related questions, and ensure they are ${fetchInterviewData?.difficulty} difficulty. Focus on the following key concepts: ${fetchInterviewData?.keyConcepts.join(', ')}. Make sure if you ask a coding question, then it is surrounded by three back ticks. Each input you will receive will consist of the user's response, such as "I'm doing good, how about you?". If the text abvoe mentions anything about struggling, then go through the following code and provide suggestions but don't be too obvious: ${code}`
            : `You are an interviewer conducting a behavioral interview. Ask an open-ended question that evaluate the user's past experiences, leadership, and problem-solving skills in the workplace.`
        },
        ...conversationHistory, // Pass conversation history to GPT
      ],
      temperature: temperature,
    });
    setLastGptTimestamp(Date.now());
    const gptResponse = response.choices[0].message.content;

    await convertTextToSpeech(gptResponse);
    setRecording(false);
    return gptResponse;
  };

  return (
    <AssistantContainer>
      <div className="relative h-full w-full flex flex-col">
        <div
          className={`relative overflow-y-scroll p-4 ${fetchInterviewData?.interviewType === 'technical' ? 'h-96' : 'flex-grow'
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
              onChange={(value) => handleCodeChange(value || '')}
            />
          </div>
        )}
      </div>
    </AssistantContainer>
  );
}

export default AssistantIdPage;
