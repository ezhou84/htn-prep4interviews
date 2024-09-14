"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label"
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectValue, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import ItemList from '@/components/shared/item-list/ItemList';
import { InputFile } from '@/components/ui/input-file';
type Props = {
  title: string;
  action?: React.ReactNode;
};

const InterviewForm: React.FC = () => {
  const [interviewType, setInterviewType] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [conceptInput, setConceptInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const pathname = usePathname();
  const router = useRouter();

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
    case 'resume':
      isFormValid = isDurationValid && resumeFile !== null;
      break;
    case 'technical':
      isFormValid = isDurationValid && difficulty !== '' && language !== '';
      break;
    case 'behavioral':
      isFormValid = isDurationValid;
      break;
    default:
      isFormValid = false;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("THIS SHIT IS RUNNING")
    const file = e.target.files?.[0] || null;
    setFileError('');
    
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      const fileReader = new FileReader();
      fileReader.onloadend = (e) => {
        const pdf = e.target?.result;
        const pdfDoc = new Uint8Array(pdf as ArrayBuffer);
        const loadingTask = window['pdfjsLib'].getDocument(pdfDoc);
        loadingTask.promise.then((pdfDoc) => {
          setResumeFile(file);
          // if (pdfDoc.numPages > 2) {
          //   setFileError('The uploaded PDF must be no more than 2 pages.');
          //   setResumeFile(null);
          // } else {
          //   setResumeFile(file);
          // }
        });
      };
      fileReader.readAsArrayBuffer(file);
    } else {
      setFileError('Please upload a valid PDF file.');
      //setResumeFile(null);
    }
  };

  const startInterview = () => {
    const interviewId = Math.random().toString(36).substr(2, 9);
    router.push(`/assistant/${interviewId}`);
  };

  const terminateInterview = () => {
    console.log('Interview ended');
    router.push('/assistant');
  };

  return (
    <>
      <div className="flex flex-col justify-around flex-grow pb-10">
        {pathname === '/assistant' && (
          <>
            {/* Interview Type Selection */}
            <div className="min-w-72">
              <label htmlFor="interviewType" className="block text-lg font-medium mb-2">
                Interview Type
              </label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Interview Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                  <SelectItem value="technical">Technical Interview</SelectItem>
                  <SelectItem value="resume">Resume Screening</SelectItem>
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
            {/* Language Selection */}
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
            {/* Resume File Upload */}
            {interviewType === 'resume' && (
              <div>
              <Label htmlFor="resumeFile" className="block text-lg font-medium mb-2">
                Upload Resume{' '}
                <span className="text-sm font-normal">(PDF, max 2 pages)</span>
              </Label>
              <InputFile
                id="resumeFile"
                accept=".pdf"
                onChange={handleFileUpload}
                className="w-full"
              />
              {fileError && <p className="text-red-500 text-sm">{fileError}</p>}
            </div>
            )}
            {/* Duration Input */}
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
                <p className="text-red-500 text-sm text-center">Duration must be 1- 30 min!</p>
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

              {/* Display added key concepts */}
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
            {/* Begin Interview Button */}
            <Button
              className="w-full bg-green-900 hover:bg-green-700 text-white font-bold py-6 px-4 rounded-md"
              onClick={startInterview}
              disabled={!isFormValid}
            >
              Begin Interview
            </Button>
          </>
        )}

        {/* If the pathname is /assistant/[id], show the End Interview button */}
        {pathname.startsWith('/assistant/') && pathname !== '/assistant' && (
          <Button
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-6 px-4 rounded-md"
            onClick={terminateInterview}
          >
            End Interview
          </Button>
        )}
      </div>
    </>
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
