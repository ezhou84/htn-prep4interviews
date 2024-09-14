"use client";

import React from 'react';
import { motion } from 'framer-motion';

type ChatBubbleProps = {
  text?: string;
  isUser: boolean;
  isLoading?: boolean;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ text = '', isUser, isLoading = false }) => {
  const loadingContainer = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
  };

  const loadingCircle = {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    margin: '0 2px',
    backgroundColor: '#888',
    borderRadius: '50%',
  };

  const loadingContainerVariants = {
    start: {
      transition: {
        staggerChildren: 0.2,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const loadingCircleVariants = {
    start: {
      y: '0%',
    },
    end: {
      y: '100%',
    },
  };

  const loadingCircleTransition = {
    duration: 0.5,
    yoyo: Infinity,
    ease: 'easeInOut',
  };

  const formatTextWithCode = (text: string) => {
    const regex = /```([\s\S]*?)```/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <pre
            key={index}
            style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '5px',
              whiteSpace: 'pre-wrap',
            }}
          >
            <code>{part}</code>
          </pre>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
      style={{ textAlign: isUser ? 'right' : 'left' }}
    >
      <div
        className={`max-w-xl p-4 rounded-lg ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
        style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
      >
        {isLoading ? (
          <motion.div
            style={loadingContainer}
            variants={loadingContainerVariants}
            initial="start"
            animate="end"
          >
            <motion.span
              style={loadingCircle}
              variants={loadingCircleVariants}
              transition={loadingCircleTransition}
            />
            <motion.span
              style={loadingCircle}
              variants={loadingCircleVariants}
              transition={loadingCircleTransition}
            />
            <motion.span
              style={loadingCircle}
              variants={loadingCircleVariants}
              transition={loadingCircleTransition}
            />
          </motion.div>
        ) : (
          <div>{formatTextWithCode(text)}</div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
