import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  Download, 
  Github, 
  Linkedin, 
  Instagram, 
  ExternalLink, 
  FileText, 
  Youtube, 
  Camera,
  Star,
  Play
} from "lucide-react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Marcel Mordarski - Quantum Computing, AI & Nanotechnology" },
    { name: "description", content: "Interdisciplinary scientist, entrepreneur, and public speaker based in Cupertino, CA. USRA Scholar at RIACS/NASA Ames, specializing in quantum computing, AI, and nanotechnology." },
    { name: "keywords", content: "Quantum Computing, AI, Nanotechnology, NASA, USRA, Research, Innovation, Climate, Public Speaker" },
    { property: "og:title", content: "Marcel Mordarski - Quantum Computing, AI & Nanotechnology" },
    { property: "og:description", content: "Interdisciplinary scientist, entrepreneur, and public speaker based in Cupertino, CA. USRA Scholar at RIACS/NASA Ames, specializing in quantum computing, AI, and nanotechnology." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://marcelmordarski.com" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Marcel Mordarski - Quantum Computing, AI & Nanotechnology" },
    { name: "twitter:description", content: "Interdisciplinary scientist, entrepreneur, and public speaker based in Cupertino, CA. USRA Scholar at RIACS/NASA Ames, specializing in quantum computing, AI, and nanotechnology." },
  ];
};

interface Project {
  title: string;
  description: string;
  skills: string[];
  buttons: Array<{
    label: string;
    icon: any;
    href?: string;
    variant?: "default" | "secondary" | "outline";
  }>;
  featured?: boolean;
  size?: "large" | "small";
}

const projects: Project[] = [
  {
    title: "human2robot",
    description: "Coordination and data layer for the robotic age. Training data platform using imitation learning from human hand video recordings. Won 2 hackathons and secured YC interview.",
    skills: ["Python", "ROS", "Isaac Lab", "SO-101 Manipulator", "Computer Vision"],
    featured: true,
    size: "large",
    buttons: [
      { label: "GitHub", icon: Github, href: "https://github.com/7jep7/human2robot", variant: "default" as const },
      { label: "Website", icon: ExternalLink, href: "https://www.l5e.xyz", variant: "outline" as const }
    ]
  },
  {
    title: "K2 AI",
    description: "Co-founded AI startup, scaled to 10 employees and >€500k revenue. Developed task mining SaaS MVP using SLMs with positive feedback from 30+ CFOs.",
    skills: ["LLMs", "SaaS", "AI Automation"],
    size: "large",
    buttons: [
      { label: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/company/100340844", variant: "outline" as const }
    ]
  },
  {
    title: "Reinforcement Learning Projects",
    description: "Reinforcement learning implementations including Monte Carlo Tree Search for wildfire suppression and autonomous control systems.",
    skills: ["PyTorch", "Reinforcement Learning", "OpenAI Gym", "ROS", "Isaac Lab"],
    size: "small",
    buttons: [
      { label: "GitHub", icon: Github, href: "https://github.com/7jep7/RL-Projects", variant: "outline" as const }
    ]
  },
  {
    title: "Wildfire Suppression Model",
    description: "Master thesis project developing MDP wildfire model with Monte-Carlo Tree Search optimization. Published first-author paper in Combustion Science & Technology.",
    skills: ["MCTS", "Optimization", "Research"],
    size: "small",
    buttons: [
      { label: "Paper", icon: FileText, href: "https://drive.google.com/file/d/1XPphLHcbn0c3HYzP-rjMFvPR8HTJrSiZ/view?usp=drive_link", variant: "outline" as const }
    ]
  },
  {
    title: "Biomechanical Exoskeleton",
    description: "Gravity-compensating shoulder exoskeleton for Long-COVID patients. Built with Arduino Mega, PID control, and conducted user testing.",
    skills: ["Arduino", "PID Control", "Biomechanics"],
    size: "small",
    buttons: [
      { label: "Demo", icon: Youtube, variant: "outline" as const }
    ]
  },
  {
    title: "Photos from Stratosphere",
    description: "High-altitude photography project capturing stunning images from the stratosphere using weather balloons and custom camera systems. Engineering challenge combining electronics, atmospheric physics, and photography.",
    skills: ["Electronics", "Photography", "Atmospheric Physics"],
    size: "small",
    buttons: [
      { label: "Video", icon: Youtube, href: "https://www.youtube.com/watch?v=IPa6hRWRHTM", variant: "outline" as const },
      { label: "Kickstarter", icon: ExternalLink, href: "https://www.kickstarter.com/projects/gordonkoehn/caelum-photos-from-stratosphere", variant: "outline" as const }
    ]
  }
];


export default function Home() {
  // Theme toggle and scroll state can be added here if needed
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white font-bold text-lg">MM</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">Marcel Mordarski</span>
          </div>
          <div className="flex gap-2">
            <a href="https://www.linkedin.com/in/marcelmordarski" target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-6 h-6 text-gray-300 hover:text-blue-400 transition" />
            </a>
            <a href="https://twitter.com/marcelmordarski" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-6 h-6 text-gray-300 hover:text-blue-400 transition" />
            </a>
            <a href="mailto:marcel@email.com" target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:border-blue-400 hover:text-blue-400">Email</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-12 gap-8 mb-8 items-center">
            {/* Profile Visual */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start">
              <div className="relative mb-6">
                <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-blue-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center">
                  {/* Quantum/AI SVG visual placeholder */}
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="54" stroke="white" strokeWidth="2" opacity="0.2" />
                    <circle cx="60" cy="60" r="40" stroke="#38bdf8" strokeWidth="2" opacity="0.5" />
                    <circle cx="60" cy="60" r="28" stroke="#a21caf" strokeWidth="2" opacity="0.7" />
                    <circle cx="60" cy="60" r="16" stroke="#06b6d4" strokeWidth="2" opacity="0.9" />
                    <circle cx="60" cy="60" r="4" fill="#fff" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Hero Text */}
            <div className="md:col-span-8 text-center md:text-left flex flex-col">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white via-blue-400 to-fuchsia-500 bg-clip-text text-transparent">
                Marcel Mordarski
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-4">
                Interdisciplinary scientist, entrepreneur, and public speaker based in Cupertino, CA. USRA Scholar at RIACS/NASA Ames, specializing in quantum computing, AI, and nanotechnology.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-2">
                <Badge className="bg-blue-600 text-white">Quantum Computing</Badge>
                <Badge className="bg-fuchsia-600 text-white">AI</Badge>
                <Badge className="bg-cyan-600 text-white">Nanotechnology</Badge>
                <Badge className="bg-gray-700 text-white">Public Speaker</Badge>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge className="bg-gray-800 text-blue-300">USRA Scholar, NASA Ames</Badge>
                <Badge className="bg-gray-800 text-fuchsia-300">Entrepreneur</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <Card className="bg-gray-900 border-gray-800 p-8">
            <h2 className="text-3xl font-bold text-white mb-6">About Marcel</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Interdisciplinary scientist, entrepreneur, and public speaker based in Cupertino, CA. USRA Scholar at RIACS/NASA Ames, specializing in quantum computing, AI, and nanotechnology. Passionate about innovation, climate change solutions, and advancing quantum technologies.
              </p>
              <p>
                Enjoys cycling, handball, skiing, Gombrowicz books, Dalí art, and debating.
              </p>
            </div>
          </Card>
        </section>

        {/* Key Roles Section */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Key Roles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-1">USRA Scholar, RIACS/NASA Ames</h3>
              <p className="text-gray-300 text-sm mb-1">May 2025–Present</p>
              <p className="text-gray-400 text-sm">Researching optimization, benchmarking, and quantum algorithms with Ising machines.</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-fuchsia-400 mb-1">Cryptographer, Quantinuum Internship</h3>
              <p className="text-gray-300 text-sm mb-1">Mar 2024–Jan 2025</p>
              <p className="text-gray-400 text-sm">Worked on quantum position verification, bit commitment, and quantum money.</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-1">Policy Expert, Polish Chamber of Commerce</h3>
              <p className="text-gray-300 text-sm mb-1">Jun 2024–Present</p>
              <p className="text-gray-400 text-sm">Advising on Quantum Technologies Committee for governmental digitization strategy.</p>
            </Card>
          </div>
        </section>

        {/* Education Section */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Education</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-1">University of Cambridge</h3>
              <p className="text-gray-300 text-sm mb-1">MPhil in Micro and Nanotechnology Enterprise (2022–2023)</p>
              <p className="text-gray-400 text-sm">Distinction, 86%; Dissertation: 91.5%</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-fuchsia-400 mb-1">UCL</h3>
              <p className="text-gray-300 text-sm mb-1">BSc in Natural Sciences (Physics + Chemistry) (2019–2022)</p>
              <p className="text-gray-400 text-sm">1st Class Honours</p>
            </Card>
          </div>
        </section>

        {/* Achievements Section */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Key Achievements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-1">Feynman Quantum Academy Scholarship (2025, USRA-NASA QuAIL)</h3>
              <p className="text-gray-400 text-sm">Research in quantum information sciences.</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-fuchsia-400 mb-1">Winner, Generation Freedom Competition (2023)</h3>
              <p className="text-gray-400 text-sm">Innovation for freedom challenge.</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-1">Winner, SchneiderGoGreen UK (2021)</h3>
              <p className="text-gray-400 text-sm">Business mindset for climate change solutions.</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-1">Finalist, Bright SCIdea Challenge (2020)</h3>
              <p className="text-gray-400 text-sm">Start-up innovation.</p>
            </Card>
          </div>
        </section>

        {/* Research & Projects Section */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Research & Projects</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-1">Spin-qubit Transistors (2023, Hitachi)</h3>
              <p className="text-gray-400 text-sm">Simulated Ge-heterostructure qubit systems, advancing quantum computing scalability.</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-fuchsia-400 mb-1">Spin Glass Physics (2021–2022, UCL)</h3>
              <p className="text-gray-400 text-sm">Applied spin glass models to neuroscience, biology, and economics, exploring quantum neural networks.</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-1">Publications</h3>
              <p className="text-gray-400 text-sm">Proposed AI-based alternatives to peer review (St Gallen Symposium, 2023) and reviewed spin glass applications (Society for Natural Sciences, 2023).</p>
            </Card>
          </div>
        </section>

        {/* Events & Speaking Section */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Events & Speaking</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-1">Speaker at 2022 NatSci Soc (Nottingham), TEDxBloomsbury, and European Commission diplomacy course</h3>
              <p className="text-gray-400 text-sm">2022–2025</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-fuchsia-400 mb-1">Participant in Y Combinator AI Startup School (2025)</h3>
              <p className="text-gray-400 text-sm">Dynamic events calendar coming soon.</p>
            </Card>
          </div>
        </section>

        {/* Business & Innovation Section */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Business & Innovation</h2>
          <Card className="bg-gray-900 border-gray-800 p-6">
            <p className="text-gray-300">Involved in start-ups and R&D, focusing on quantum computing and AI-driven climate solutions. Advocate for interdisciplinary science and disruptive innovation.</p>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2 className="text-3xl font-bold text-white mb-6">Contact</h2>
          <Card className="bg-gray-900 border-gray-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-4 items-center">
              <a href="https://www.linkedin.com/in/marcelmordarski" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
                <span className="font-medium">LinkedIn</span>
              </a>
              <a href="https://twitter.com/marcelmordarski" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200">
                <ExternalLink className="w-5 h-5" />
                <span className="font-medium">Twitter</span>
              </a>
              <a href="mailto:marcel@email.com" className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200">
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:border-blue-400 hover:text-blue-400">Email</Button>
              </a>
            </div>
            <span className="text-gray-400 text-sm">© 2025 Marcel Mordarski.</span>
          </Card>
        </section>
      </main>
    </div>
  );
}
