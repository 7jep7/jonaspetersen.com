import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { CareerTrace } from "~/components/CareerTrace";
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
    { name: "description", content: "Head of Research at Forgis, building the industrial world model. 10 papers at NeurIPS and ICML 2026 (1 Oral, 1 Spotlight), a $300k GPU grant and the Google DeepMind Accelerator. Cambridge, Imperial, ETH." },
    { name: "keywords", content: "AI, World Models, JEPA, Industrial AI, Manufacturing, Time Series, Machine Learning, Forgis" },
    { property: "og:title", content: "Jonas Petersen - Head of Research at Forgis" },
    { property: "og:description", content: "Head of Research at Forgis, building the industrial world model. 10 papers at NeurIPS and ICML 2026 (1 Oral, 1 Spotlight), a $300k GPU grant and the Google DeepMind Accelerator. Cambridge, Imperial, ETH." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://jonaspetersen.com" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Jonas Petersen - Head of Research at Forgis" },
    { name: "twitter:description", content: "Head of Research at Forgis, building the industrial world model. 10 papers at NeurIPS and ICML 2026 (1 Oral, 1 Spotlight), a $300k GPU grant and the Google DeepMind Accelerator. Cambridge, Imperial, ETH." },
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
    description: "Co-founded AI startup, scaled to 10 employees and >€500k revenue in 10 months. Developed task mining SaaS MVP using SLMs with positive feedback from 30+ CFOs.",
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

interface Publication {
  name: string;
  summary: string;
  venue: string;
  link?: string;
  award?: string;
  logo?: string;
  result?: string;
}

const publications: Publication[] = [
  { name: "FactoryBench", summary: "Benchmark for industrial machine understanding", venue: "PUDM @ NeurIPS", award: "Oral", link: "https://arxiv.org/abs/2605.07675", result: "70k+ questions at four causal levels. Frontier LLMs stay under 50% on structured tasks and reach 18% on decisions." },
  { name: "Saturn", summary: "A time-series foundation model for classification and event forecasting", venue: "FMTS @ NeurIPS", logo: "/saturn-logo.png" },
  { name: "KITE", summary: "Knowledge-injected encoder for time-series event forecasting", venue: "FMTS @ NeurIPS", link: "https://arxiv.org/abs/2610.12738", result: "Switchable expert-knowledge injection: +14% from a periodicity clock, +53% out of domain." },
  { name: "Certified Access", summary: "Test-time compute on a physics-structured memory", venue: "LCFM @ NeurIPS", link: "https://arxiv.org/abs/2610.39073", result: "Test-time compute over a symplectic memory that keeps its stability guarantees." },
  { name: "Retention", summary: "Predictable retention and exact deletion in a physics-structured memory", venue: "STODY @ NeurIPS", link: "https://openreview.net/pdf?id=piKgPzLiyx", result: "Friction keeps memories and temperature erases them. Deletion is exact." },
  { name: "HEPA", summary: "World model architecture for event prediction in time series", venue: "FMSD @ ICML", award: "Spotlight", link: "https://arxiv.org/abs/2605.11130", result: "Beats PatchTST, iTransformer, MAE and Chronos-2 on 10 of 14 benchmarks with one architecture and fixed hyperparameters." },
  { name: "FactoryNet", summary: "Large-scale dataset for industrial time-series foundation models", venue: "AI4Physics + FMSD @ ICML", link: "https://arxiv.org/abs/2605.09081", result: "Models trained on simulation transfer within robot families, but rarely across manufacturers." },
  { name: "Tabula RASA", summary: "Structural inductive bias for knowledge graph reasoning", venue: "GFM @ ICML", link: "https://arxiv.org/abs/2602.02834", result: "Sparse adjacency masking alone gives most of the gain: topology matters more than relation-specific parameters." },
];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  // One publication result open at a time; all folded by default.
  const [openPub, setOpenPub] = useState<string | null>(null);

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
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b ${isScrolled
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
                  industrial world model
                </span>
                .{" "}
                10 papers at NeurIPS and ICML 2026 (1 Oral, 1 Spotlight), a $300k GPU grant and the Google DeepMind Accelerator.
                Cambridge, Imperial, ETH.
              </p>
            </div>
          </div>
          <CareerTrace />
        </section>

        {/* About Section */}
        <section id="about" className="max-w-4xl mx-auto px-6 pb-16 scroll-mt-24">
          <div>
            <Card className="bg-gray-800 border-gray-700 p-8">
              <h2 className="text-3xl font-bold text-white mb-6">About</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  First employee at <a href="https://www.forgis.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold">Forgis</a>,
                  where we build <strong>Hyperion</strong>, an industrial world model that learns machine dynamics from sensor data and predicts
                  critical events across whole factories. I built the research team from scratch: <strong>10 researchers</strong> from
                  ETH, Cambridge, Oxford, Imperial, Stanford and Berkeley, with <strong>10 papers</strong> accepted at NeurIPS and ICML 2026.
                  First author on 5, including an ICML spotlight, and last author on a NeurIPS oral.
                </p>
                <p>
                  The research ships. Hyperion runs at the machine on a single edge GPU next to a fine-tuned Gemma 3n, a deployment
                  Google DeepMind <a href="https://deepmind.google/models/gemma/gemmaverse/forgis/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold">features in its Gemmaverse</a>.
                  We came through the <strong>Google DeepMind Accelerator</strong> and won a <strong>$300k GPU grant</strong> from the Swiss National
                  Supercomputing Centre. Before Forgis I co-founded a startup that reached <strong>€500k revenue</strong> in 10 months.
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
        <section id="publications" className="max-w-4xl mx-auto px-6 pb-16 scroll-mt-24">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Publications</h2>
          <p className="text-gray-400 text-center mb-8">My papers at NeurIPS and ICML 2026.</p>

          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="divide-y divide-gray-700">
              {publications.map((pub) => {
                const row = (
                  <>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        {pub.award && (
                          <Badge className="bg-orange-500 text-white px-2 py-0.5 text-xs font-semibold shrink-0">{pub.award}</Badge>
                        )}
                        {pub.logo && <img src={pub.logo} alt="" className="h-5 w-auto shrink-0" />}
                        <span className="text-white group-hover:text-orange-400 transition-colors truncate"><strong>{pub.name}</strong> <span className="text-gray-400">{pub.summary}</span></span>
                      </div>
                      {pub.result && (
                        <p className={`grid ${openPub === pub.name ? "grid-rows-[1fr]" : "grid-rows-[0fr]"} transition-[grid-template-rows] duration-300 ease-out`}>
                          <span className="overflow-hidden text-sm text-gray-400">
                            <span className="block pt-1.5 font-mono text-orange-400/80">→ {pub.result}</span>
                          </span>
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-gray-700 text-gray-400 shrink-0 text-xs self-start mt-0.5">{pub.venue}</Badge>
                  </>
                );
                const className = "flex justify-between gap-3 group py-3";
                const fold = {
                  onMouseEnter: () => setOpenPub(pub.name),
                  onMouseLeave: () => setOpenPub(null),
                  onFocus: () => setOpenPub(pub.name),
                  // Touch screens have no hover: the first tap unfolds, the second follows the link.
                  onClick: (e: React.MouseEvent) => {
                    if (!window.matchMedia("(hover: none)").matches) return;
                    if (openPub !== pub.name) {
                      e.preventDefault();
                      setOpenPub(pub.name);
                    }
                  },
                };
                return pub.link ? (
                  <a key={pub.name} href={pub.link} target="_blank" rel="noopener noreferrer" className={className} {...fold}>{row}</a>
                ) : (
                  <div key={pub.name} className={className} {...fold}>{row}</div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* Simple Projects Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Projects</h2>

          <div className="space-y-8">
            {/* Forgis - Featured */}
            <Card id="forgis" className="scroll-mt-24 bg-gray-800 border-gray-700 p-8 relative">
              <div className="absolute -top-3 left-8">
                <Badge className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                  <Star className="w-3 h-3 mr-1" />
                  Current Focus
                </Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-3">Forgis - Hyperion</h3>
                <p className="text-white leading-relaxed mb-4">
                  The industrial world model. Hyperion learns machine dynamics from raw sensor data with JEPA
                  self-supervised pretraining, then predicts failures, anomalies and regime changes across whole
                  factories from few labels. Validated with Fortune 100 customers and deployed at the edge with Google DeepMind.
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

              <Card id="k2" className="scroll-mt-24 bg-gray-800 border-gray-700 p-5">
                <h3 className="text-lg font-bold text-white mb-2">K2 AI</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Co-founded AI startup. 10 employees, &gt;€500k revenue in 10 months, 30+ CFO conversations.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('https://www.linkedin.com/company/100340844', '_blank')} className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500">
                    <Linkedin className="w-3 h-3 mr-1" />LinkedIn
                  </Button>
                </div>
              </Card>

              <Card id="wildfire" className="scroll-mt-24 bg-gray-800 border-gray-700 p-5">
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
