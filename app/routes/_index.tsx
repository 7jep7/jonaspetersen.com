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
  Play,
  BookOpen,
  GraduationCap,
  Award
} from "lucide-react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Jonas Petersen - Head of Research at Forgis" },
    { name: "description", content: "Head of Research at Forgis, building the world model for industrial systems. 4 ICML 2026 papers (1 Spotlight) in 6 months. Cambridge, Imperial, ETH." },
    { name: "keywords", content: "AI, World Models, JEPA, Industrial AI, Manufacturing, Time Series, Machine Learning, Forgis" },
    { property: "og:title", content: "Jonas Petersen - Head of Research at Forgis" },
    { property: "og:description", content: "Head of Research at Forgis, building the world model for industrial systems. 4 ICML 2026 papers (1 Spotlight) in 6 months. Cambridge, Imperial, ETH." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://jonaspetersen.com" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Jonas Petersen - Head of Research at Forgis" },
    { name: "twitter:description", content: "Head of Research at Forgis, building the world model for industrial systems. 4 ICML 2026 papers (1 Spotlight) in 6 months. Cambridge, Imperial, ETH." },
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
    title: "LBM Arena",
    description: "Competitive benchmarking platform where Large Behaviour Models compete across games to determine their relative strength. Solving the reproducibility crisis in robotics AI evaluation.",
    skills: ["Game Theory", "Model Evaluation", "Competition Platform", "Benchmarking"],
    featured: true,
    size: "large",
    buttons: [
      { label: "Visit Arena", icon: ExternalLink, href: "/projects/lbm-arena", variant: "default" as const },
      { label: "Submit Model", icon: Star, href: "/projects/lbm-arena#submit", variant: "outline" as const }
    ]
  },
  {
    title: "PLC Copilot",
    description: "AI-powered assistant for industrial automation and PLC programming. Expert guidance on control systems, structured text programming, and industrial protocols using GPT-4o.",
    skills: ["PLC Programming", "Industrial AI", "Automation", "GPT-4o"],
    featured: true,
    size: "large",
    buttons: [
      { label: "Try Copilot", icon: Play, href: "/projects/plc-copilot", variant: "default" as const }
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };

    // Check initial scroll position
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDownloadCV = () => {
    // Create a link to download the CV
    const link = document.createElement('a');
    link.href = '/cv.pdf';
    link.download = 'Jonas_Petersen_CV.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPresentation = () => {
    // Create a link to download the exoskeleton presentation
    const link = document.createElement('a');
    link.href = '/exoskeleton-presentation.pdf';
    link.download = 'Exoskeleton_Presentation_Jonas_Petersen.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b ${
        isScrolled 
          ? 'bg-gray-900/60 backdrop-blur-2xl border-gray-600/20 shadow-xl shadow-black/10' 
          : 'bg-gray-800/70 backdrop-blur-md border-gray-700/50'
      }`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">JP</span>
            </div>
          </div>
          <Button 
            onClick={handleDownloadCV}
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CV
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-12 gap-8 mb-8">
            {/* Profile Photo */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-48 h-48 rounded-full p-0.5 bg-white">
                  <img
                  src="/LinkedIn profile pic - shirt.png"
                  alt="Jonas Petersen"
                  className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-5">
                <a
                  href="https://github.com/7jep7"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com/in/jep7"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://scholar.google.com/citations?user=1x_taE4AAAAJ"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Google Scholar"
                >
                  <GraduationCap className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Text Content */}
            <div className="md:col-span-8 text-center md:text-left flex flex-col">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white via-orange-400 to-orange-600 bg-clip-text text-transparent">
                Hi, I'm Jonas
              </h1>
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8 md:mb-0">
                  Head of Research at{" "}
                  <a href="https://www.forgis.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold">Forgis</a>,
                  building the{" "}
                    <span className="bg-orange-400 rounded px-1 font-bold" style={{ lineHeight: "1.5", paddingTop: "0.1em", paddingBottom: "0.1em" }}>
                      world model for industrial systems
                    </span>
                    .{" "}
                  4 ICML 2026 papers (1 Spotlight).
                  Cambridge, Imperial, ETH.
                </p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div>
            <Card className="bg-gray-800 border-gray-700 p-8">
              <h2 className="text-3xl font-bold text-white mb-6">About</h2>
                            <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  First employee at <a href="https://www.forgis.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold">Forgis</a>,
                  where we build <strong>Hyperion</strong>: a world model that learns machine dynamics from sensor data and predicts
                  critical events across entire factories. Built the research division from scratch: <strong>10 researchers</strong> across
                  ETH, Cambridge, Oxford, Imperial, Stanford, and Berkeley, <strong>4 ICML 2026 papers</strong> (1 Spotlight) in 6 months.
                  Previously co-founded a startup to <strong>€500k revenue</strong> in under 12 months. Degrees from Cambridge and Imperial.
                </p>
                <p>
                  Manufacturing is 16% of GDP and the backbone of European prosperity, yet it's in decline.
                  The factories our parents worked in deserve better than slow decay. That's what this is about.
                </p>
                <p>
                  When not staring at loss curves: tennis, mountains, or losing a chess game that was clearly won.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Publications Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Publications</h2>
          <p className="text-gray-400 text-center mb-8">All from our first 6 months. We're just getting started.</p>

          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="space-y-3">
              <a href="https://www.forgis.com/papers/hepa.html" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 group py-2 border-b border-gray-700 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge className="bg-orange-500 text-white px-2 py-0.5 text-xs font-semibold shrink-0">Spotlight</Badge>
                  <span className="text-white group-hover:text-orange-400 transition-colors truncate"><strong>HEPA</strong> <span className="text-gray-400">World model architecture for event prediction in time series</span></span>
                </div>
                <Badge variant="secondary" className="bg-gray-700 text-gray-400 shrink-0 text-xs">FMSD @ ICML</Badge>
              </a>
              <a href="https://www.forgis.com/papers/factorybench.html" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 group py-2 border-b border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-white group-hover:text-orange-400 transition-colors truncate"><strong>FactoryBench</strong> <span className="text-gray-400">Benchmark for industrial machine understanding</span></span>
                </div>
                <Badge variant="secondary" className="bg-gray-700 text-gray-400 shrink-0 text-xs">arXiv</Badge>
              </a>
              <a href="https://www.forgis.com/papers/factorynet.html" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 group py-2 border-b border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-white group-hover:text-orange-400 transition-colors truncate"><strong>FactoryNet</strong> <span className="text-gray-400">Large-scale dataset for industrial time-series foundation models</span></span>
                </div>
                <Badge variant="secondary" className="bg-gray-700 text-gray-400 shrink-0 text-xs">AI4Physics @ ICML</Badge>
              </a>
              <a href="https://www.forgis.com/papers/rasa.html" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 group py-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-white group-hover:text-orange-400 transition-colors truncate"><strong>Tabula RASA</strong> <span className="text-gray-400">Structural inductive bias for knowledge graph reasoning</span></span>
                </div>
                <Badge variant="secondary" className="bg-gray-700 text-gray-400 shrink-0 text-xs">GFM @ ICML</Badge>
              </a>
            </div>
          </Card>
        </section>

        {/* Simple Projects Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Projects</h2>

          <div className="space-y-8">
            {/* Forgis - Featured */}
            <Card className="bg-gray-800 border-gray-700 p-8 relative">
              <div className="absolute -top-3 left-8">
                <Badge className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                  <Star className="w-3 h-3 mr-1" />
                  Current Focus
                </Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-3">Forgis - Hyperion</h3>
                <p className="text-white leading-relaxed mb-4">
                  The world model for industrial systems. Hyperion learns machine dynamics from raw sensor data
                  using JEPA self-supervised pretraining, predicting failures, anomalies, and regime changes
                  across entire factories with minimal labels. Validated with Fortune 100 customers.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">JEPA</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">World Models</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Time Series</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Self-Supervised Learning</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Manufacturing AI</Badge>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.open('https://www.forgis.com', '_blank')}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Website
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://arxiv.org/abs/2605.11130', '_blank')}
                  className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  HEPA Paper
                </Button>
              </div>
            </Card>

            {/* Other Projects - Compact Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700 p-5">
                <h3 className="text-lg font-bold text-white mb-2">human2robot</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Imitation learning from human hand video. Won 2 hackathons, secured YC interview.
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="default" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Link to="/projects/hand-teleop"><Play className="w-3 h-3 mr-1" />Demo</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('https://github.com/7jep7/human2robot', '_blank')} className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500">
                    <Github className="w-3 h-3 mr-1" />Code
                  </Button>
                </div>
              </Card>

              <Card className="bg-gray-800 border-gray-700 p-5">
                <h3 className="text-lg font-bold text-white mb-2">K2 AI</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Co-founded AI startup. 10 employees, &gt;€500k revenue, 30+ CFO conversations.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('https://www.linkedin.com/company/100340844', '_blank')} className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500">
                    <Linkedin className="w-3 h-3 mr-1" />LinkedIn
                  </Button>
                </div>
              </Card>

              <Card className="bg-gray-800 border-gray-700 p-5">
                <h3 className="text-lg font-bold text-white mb-2">Wildfire Suppression</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Cambridge master's thesis. MDP + MCTS optimization. Published in Combustion Science & Technology.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('https://drive.google.com/file/d/1XPphLHcbn0c3HYzP-rjMFvPR8HTJrSiZ/view?usp=drive_link', '_blank')} className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500">
                    <FileText className="w-3 h-3 mr-1" />Paper
                  </Button>
                </div>
              </Card>

              <Card className="bg-gray-800 border-gray-700 p-5">
                <h3 className="text-lg font-bold text-white mb-2">PLC Copilot</h3>
                <p className="text-gray-300 text-sm mb-3">
                  AI assistant for industrial PLC programming. Try it live.
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="default" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Link to="/projects/plc-copilot"><Play className="w-3 h-3 mr-1" />Try it</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('https://github.com/7jep7/plc-copilot', '_blank')} className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500">
                    <Github className="w-3 h-3 mr-1" />Code
                  </Button>
                </div>
              </Card>

              <Card className="bg-gray-800 border-gray-700 p-5">
                <h3 className="text-lg font-bold text-white mb-2">RL Projects</h3>
                <p className="text-gray-300 text-sm mb-3">
                  DQN, PPO/SAC, Othello agent. 2nd place at Robo Innovate 2025.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('https://github.com/7jep7/RL-Projects', '_blank')} className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500">
                    <Github className="w-3 h-3 mr-1" />Code
                  </Button>
                </div>
              </Card>

              <Card className="bg-gray-800 border-gray-700 p-5">
                <h3 className="text-lg font-bold text-white mb-2">Stratosphere Photos</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Weather balloon photography from the stratosphere. Kickstarter funded.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('https://www.youtube.com/watch?v=IPa6hRWRHTM', '_blank')} className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500">
                    <Youtube className="w-3 h-3 mr-1" />Video
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="border-t border-gray-700 pt-12">
            <p className="text-gray-300 mb-6">Always happy to chat about world models, manufacturing, or your tennis backhand.</p>
            <div className="flex justify-center space-x-5 mb-8">
              <a
                href="https://linkedin.com/in/jep7"
                className="text-gray-300 hover:text-orange-500 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/7jep7"
                className="text-gray-300 hover:text-orange-500 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://scholar.google.com/citations?user=1x_taE4AAAAJ"
                className="text-gray-300 hover:text-orange-500 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                title="Google Scholar"
              >
                <GraduationCap className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/7jep7"
                className="text-gray-300 hover:text-orange-500 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <p className="text-gray-400 text-sm">© 2026 Jonas Petersen.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
