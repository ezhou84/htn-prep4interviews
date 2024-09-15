"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectValue, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import ItemList from '@/components/shared/item-list/ItemList';
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";

type Props = {
  title: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
};

const InterviewForm: React.FC = () => {
  const [interviewType, setInterviewType] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [conceptInput, setConceptInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<string>('');
  const pathname = usePathname();
  const router = useRouter();
  const createInterview = useMutation(api.interview.create);
  
  const handleAddConcept = () => {
    if (conceptInput && !keyConcepts.includes(conceptInput)) {
      setKeyConcepts([...keyConcepts, conceptInput]);
      setConceptInput('');
    }
  };

  const handleRemoveConcept = (index: number) => {
    setKeyConcepts(keyConcepts.filter((_, i) => i !== index));
  };

  const durationValue = parseInt(duration, 10);
  const isDurationValid = !isNaN(durationValue) && durationValue >= 1 && durationValue <= 30;
  let isFormValid = false;

  switch (interviewType) {
    case 'technical':
      isFormValid = isDurationValid && difficulty !== '' && language !== '';
      break;
    case 'behavioural':
      isFormValid = isDurationValid;
      break;
    default:
      isFormValid = false;
  }
  
  const { user, isSignedIn } = useUser();

  const startInterview = async () => {
    setIsLoading(true);
    if (!user) {
      console.error("User is not signed in");
      return;
    }
    const interviewData = {
      clerkId: user.id,
      interviewType,
      difficulty,
      language,
      duration: parseInt(duration, 10),
      keyConcepts,
    };

    try {
      const interviewId = await createInterview(interviewData);
      router.push(`/assistant/${interviewId}`);
    } catch (error) {
      console.error("Failed to save interview:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const terminateInterview = () => {
    router.push('/assistant');
  };

  return (
    <div className="flex flex-col justify-around flex-grow pb-10">
      {pathname === '/assistant' && (
        <>
          <div className="min-w-72">
            <label htmlFor="interviewType" className="block text-lg font-medium mb-2">
              Interview Type
            </label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Interview Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="behavioural">Behavioural Interview</SelectItem>
                <SelectItem value="technical">Technical Interview</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {interviewType === 'technical' && (
            <div>
              <label htmlFor="difficulty" className="block text-lg font-medium mb-2">
                Difficulty
              </label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {interviewType === 'technical' && (
            <div>
              <label htmlFor="language" className="block text-lg font-medium mb-2">
                Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="duration" className="block text-lg font-medium mb-2">
              Duration (minutes)
            </Label>
            <Input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full"
              min="1"
              max="30"
              placeholder="1-30"
            />
            {!isDurationValid && duration && (
              <p className="text-red-500 text-sm text-center">Duration must be 1-30 min!</p>
            )}
          </div>
          {interviewType === 'technical' && (
            <div>
              <Label className="block text-lg font-medium mb-2">Key Concepts</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  placeholder="Add a concept"
                  className="flex-1"
                />
                <Button variant="default" onClick={handleAddConcept}>
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {keyConcepts.map((concept, index) => (
                  <span
                    key={index}
                    className="flex items-center bg-blue-100 dark:bg-gray-700 text-sm font-medium px-3 py-0.5 rounded"
                  >
                    {concept.length > 8 ? concept.slice(0, 8) + '...' : concept}
                    <Button
                      className="ml-1 text-black rounded-full text-xs p-0.5 bg-transparent hover:bg-red-400"
                      onClick={() => handleRemoveConcept(index)}
                    >
                      ×
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <Button
            className="w-full bg-green-900 hover:bg-green-700 text-white font-bold py-6 px-4 rounded-md"
            onClick={startInterview}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Loading...' : 'Begin Interview'}
          </Button>
        </>
      )}
      {pathname.startsWith('/assistant/') && pathname !== '/assistant' && (
        <Button
          className="min-w-72 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-6 px-4 rounded-md"
          onClick={terminateInterview}
        >
          End Interview
        </Button>
      )}
    </div>
  );
};

const AssistantLayout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <ItemList title="AI Assistant">
        <InterviewForm />
      </ItemList>
      {children}
    </>
  );
};

export default AssistantLayout;
