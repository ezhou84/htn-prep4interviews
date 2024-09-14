"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const blobVariants = {
  animate: {
    scale: [1, 3, 1],
    x: [0, 100, -100, 0],
    y: [50, -150, 300, 50],
    transition: {
      duration: 20,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

const LandingPage = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-300 to-purple-400 dark:from-blue-900 dark:to-purple-900 blur-xl opacity-70"
      >
        <motion.div
          className="absolute top-0 left-0 w-72 h-72 bg-green-300 dark:bg-green-700 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
          variants={blobVariants}
          animate="animate"
        ></motion.div>

        {/* Pink Blob */}
        <motion.div
          className="absolute top-0 right-0 w-122 h-122 bg-pink-300 dark:bg-pink-700 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
          variants={blobVariants}
          animate="animate"
        ></motion.div>

        {/* Yellow Blob */}
        <motion.div
          className="absolute bottom-0 left-20 w-72 h-72 bg-yellow-300 dark:bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
          variants={blobVariants}
          animate="animate"
        ></motion.div>
      </motion.div>

      <h1 className="text-8xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 z-10 w-4/5">
        Welcome to Prep4Interviews
      </h1>

      <p className="text-lg text-gray-900 dark:text-gray-300 mb-8 max-w-2xl z-10">
        Your go-to platform to prepare for interview questions and land your dream job!
      </p>

      <div className="flex space-x-4 z-10">
        <Button
          asChild
          className="px-12 py-6 font-bold text-black bg-white hover:bg-gray-100 hover:scale-105 transition-all duration-300 dark:bg-white shadow-lg text-xl"
        >
          <Link href="/signin">Sign In</Link>
        </Button>

        <Button
          asChild
          className="px-12 py-6 font-bold text-white bg-black hover:bg-gray-800 hover:scale-105 transition-all duration-300 dark:bg-black shadow-lg text-xl"
        >
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>


    </div>
  );
};

export default LandingPage;