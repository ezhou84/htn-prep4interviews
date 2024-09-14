import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans } from 'next/font/google';
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";
const dmSans = DM_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Prep4Interviews",
  description: "Prepare for interviews!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              {children}
            </TooltipProvider>
        </ThemeProvider>
        </body> 
    </html>
  );
}
