import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "EventSprint.AI | Autonomous Hackathon Engine",
  description: "Autonomous team formation and AI pitch evaluation protocol.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased min-h-screen relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
        <Navbar />
        {children}
      </body>
    </html>
  );
}