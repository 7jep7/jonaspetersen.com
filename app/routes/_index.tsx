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
    { title: "Jonas Petersen - AI Engineer & Robotics Researcher" },
    { name: "description", content: "Computational engineer with AI/robotics expertise. Co-founded and scaled AI startup to €500k revenue. Cambridge MPhil, Imperial MEng. Building the future of human-robot interaction." },
    { name: "keywords", content: "AI, Robotics, Machine Learning, Reinforcement Learning, Engineer, Startup Founder" },
    { property: "og:title", content: "Jonas Petersen - AI Engineer & Robotics Researcher" },
    { property: "og:description", content: "Computational engineer with AI/robotics expertise. Co-founded and scaled AI startup to €500k revenue. Cambridge MPhil, Imperial MEng. Building the future of human-robot interaction." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://jonaspetersen.com" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Jonas Petersen - AI Engineer & Robotics Researcher" },
    { name: "twitter:description", content: "Computational engineer with AI/robotics expertise. Co-founded and scaled AI startup to €500k revenue. Cambridge MPhil, Imperial MEng. Building the future of human-robot interaction." },
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
            <div className="md:col-span-4 flex flex-col items-center md:items-start">
              <div className="relative mb-6">
                <div className="w-48 h-48 rounded-full p-0.5 bg-white">
                  <img 
                  src="/LinkedIn profile pic - shirt.png" 
                  alt="Jonas Petersen" 
                  className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-6 md:mt-auto">
                <a 
                  href="https://github.com/7jep7" 
                  className="flex items-center space-x-2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm font-medium">GitHub</span>
                </a>
                <a 
                  href="https://linkedin.com/in/jep7" 
                  className="flex items-center space-x-2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="w-5 h-5" />
                  <span className="text-sm font-medium">LinkedIn</span>
                </a>
              </div>
            </div>
            
            {/* Text Content */}
            <div className="md:col-span-8 text-center md:text-left flex flex-col">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white via-orange-400 to-orange-600 bg-clip-text text-transparent">
                Hi, I'm Jonas
              </h1>
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8 md:mb-0">
                  Computational engineer with AI and robotics expertise.
                  Co-founder who scaled a startup to €500k revenue.
                  Educated at Imperial College and Cambridge University.&nbsp;
                    Building the data pipelines for shipping{" "}
                    <span className="bg-orange-400 rounded px-1 font-bold" style={{ lineHeight: "1.5", paddingTop: "0.1em", paddingBottom: "0.1em" }}>
                      true robotic intelligence
                    </span>
                    .
                </p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div>
            <Card className="bg-gray-800 border-gray-700 p-8">
              <h2 className="text-3xl font-bold text-white mb-6">About Me</h2>
                            <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  I'm a German engineer and founder drawn to <strong>embodied AI</strong>, where robots learn to move and think like humans. 
                  My work spans from <strong>creating advanced robotics systems</strong> to innovative AI solutions that solve real-world problems.
                </p>
                <p>
                  With a background in <strong>mechanical engineering and computing</strong>, I've led projects ranging from biomechanical 
                  exoskeletons to <strong>reinforcement learning training data pipelines</strong>. I co-founded and scaled a tech startup to 
                    {" "}<strong>€500k in revenues</strong>, less than 12 months out of uni.
                </p>
                <p>
                  To me, solving embodied AI is the most challenging and enticing problem of our time.
                  Humanity is on track to be <strong>100M workers short by 2030</strong> alone due to our post-modern ageing society. 
                  Embodied AI can fix this. And I would like my future family to live a life as beautiful and better than 
                  what I am so grateful for living today. Extremely excited to be alive right now and make a dent!
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Simple Projects Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Projects</h2>
          
          <div className="space-y-8">
            {/* human2robot - Featured */}
            <Card className="bg-gray-800 border-gray-700 p-8 relative">
              <div className="absolute -top-3 left-8">
                <Badge className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-3">human2robot</h3>
                <p className="text-white leading-relaxed mb-4">
                  Coordination and data layer for the robotic age. Training data platform using imitation learning from human hand video recordings.&nbsp;
                  <a
                  href="https://www.linkedin.com/posts/jep7_rl-imitation-learning-activity-7345208378501062657-ga36?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBDePQBszetOjFm1YJUCXql69BtJb6OTaY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline hover:text-orange-500"
                  >
                  Won 2 hackathons
                  </a>
                  &nbsp;and secured YC interview.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Python</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">ROS</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Imitation Learning</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Isaac Gym</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">SO-101 Manipulator</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Computer Vision</Badge>
              </div>
              <div className="flex gap-3">
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Link to="/projects/hand-teleop">
                    <Play className="w-4 h-4 mr-2" />
                    Live Demo
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://github.com/7jep7/human2robot', '_blank')}
                  className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.l5e.xyz', '_blank')}
                  className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Website
                </Button>
              </div>
            </Card>

            {/* K2 AI */}
            <Card className="bg-gray-800 border-gray-700 p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-3">K2 AI</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Co-founded AI startup, scaled to 10 employees and &gt;€500k revenue. Developed task mining SaaS MVP using SLMs with positive feedback from 30+ CFOs.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">SLMs</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Enterprise Sales</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Leadership</Badge>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.linkedin.com/company/100340844', '_blank')}
                  className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
              </div>
            </Card>

            {/* Small Projects Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* RL Projects */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">RL Projects</h3>
                    <p className="text-white leading-relaxed mb-4">
                      This repository showcases my reinforcement learning expertise through projects like CartPole DQN, MuJoCo PPO/SAC, an Othello RL agent, and a Tesla Optimus-inspired robotic system, earning{" "}
                      <a 
                        href="https://roboinnovate.mirmi.tum.de/roboinnovate-hackathon-2025/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-white underline hover:text-orange-500"
                      >
                        2nd place with ExVo at Robo Innovate 2025
                      </a>
                      , Germany's largest robotics hackathon.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">PyTorch</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Reinforcement Learning</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">OpenAI Gym</Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://github.com/7jep7/RL-Projects', '_blank')}
                    className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Button>
                </div>
              </Card>

              {/* Wildfire Suppression Model */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">Wildfire Suppression Model</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Master thesis project developing MDP wildfire model with Monte-Carlo Tree Search optimization. Published first-author paper in Combustion Science & Technology.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">MCTS</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">MDP</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Optimization</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Research</Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://drive.google.com/file/d/1XPphLHcbn0c3HYzP-rjMFvPR8HTJrSiZ/view?usp=drive_link', '_blank')}
                    className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Paper
                  </Button>
                </div>
              </Card>

              {/* Biomechanical Exoskeleton */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">Biomechanical Exoskeleton</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Gravity-compensating shoulder exoskeleton for Long-COVID patients. Built with Arduino Mega, PID control, and conducted user testing.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Arduino</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">PID Control</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Biomechanics</Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPresentation}
                    className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Presentation
                  </Button>
                </div>
              </Card>

              {/* LBM Arena */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">LBM Arena</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Competitive platform for Lattice Boltzmann Method simulations. Test and benchmark your fluid dynamics models against others in various challenging scenarios.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">LBM</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Fluid Dynamics</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Competition</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Simulation</Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Link to="/projects/lbm-arena">
                      <Play className="w-4 h-4 mr-2" />
                      Try Arena
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://github.com/7jep7/lbm-arena', '_blank')}
                    className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Button>
                </div>
              </Card>

              {/* PLC Copilot */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">PLC Copilot</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    AI-powered assistant for industrial automation and PLC programming. Get expert guidance on control systems, structured text programming, and industrial protocols.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">PLC Programming</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Industrial AI</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Automation</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">GPT-4o</Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Link to="/projects/plc-copilot">
                      <Play className="w-4 h-4 mr-2" />
                      Try Copilot
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://github.com/7jep7/plc-copilot', '_blank')}
                    className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Button>
                  {/* Removed extra PLC Copilot repo button */}
                </div>
              </Card>

              {/* Photos from Stratosphere */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">Photos from Stratosphere</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    High-altitude photography project capturing stunning images from the stratosphere using weather balloons and custom camera systems. Engineering challenge combining electronics, atmospheric physics, and photography.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Electronics</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Fundraising</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Atmospheric Physics</Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.youtube.com/watch?v=IPa6hRWRHTM', '_blank')}
                    className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                  >
                    <Youtube className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.kickstarter.com/projects/gordonkoehn/caelum-photos-from-stratosphere', '_blank')}
                    className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Kickstarter
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="border-t border-gray-700 pt-12">
            <p className="text-gray-300 mb-6">Let's connect and build something amazing together</p>
            <div className="flex justify-center space-x-6 mb-8">
              <a 
                href="https://linkedin.com/in/jep7" 
                className="flex items-center space-x-2 text-gray-300 hover:text-orange-500 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5" />
                <span className="font-medium">LinkedIn</span>
              </a>
              <a 
                href="https://github.com/7jep7" 
                className="flex items-center space-x-2 text-gray-300 hover:text-orange-500 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">GitHub</span>
              </a>
              <a 
                href="https://instagram.com/7jep7" 
                className="flex items-center space-x-2 text-gray-300 hover:text-orange-500 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5" />
                <span className="font-medium">Instagram</span>
              </a>
            </div>
            <p className="text-gray-400 text-sm">© 2025 Jonas Petersen.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
