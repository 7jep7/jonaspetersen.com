import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Github, 
  Linkedin, 
  Instagram, 
  ExternalLink, 
  FileText, 
  Youtube, 
  Camera,
  Star
} from "lucide-react";

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
}

const projects: Project[] = [
  {
    title: "human2robot",
    description: "Coordination and data layer for the robotic age. Training data platform using imitation learning from human hand video recordings. Won 2 hackathons and secured YC interview.",
    skills: ["Python", "ROS", "Isaac Gym", "Hugging Face", "Computer Vision"],
    featured: true,
    buttons: [
      { label: "GitHub", icon: Github, variant: "default" as const },
    ]
  },
  {
    title: "RL Projects",
    description: "Reinforcement learning implementations including Monte Carlo Tree Search for wildfire suppression and autonomous control systems.",
    skills: ["PyTorch", "MCTS", "OpenAI Gym"],
    buttons: [
      { label: "GitHub", icon: Github, variant: "secondary" as const }
    ]
  },
  {
    title: "K2 AI",
    description: "Co-founded AI startup, scaled to 10 employees and >€500k revenue. Developed task mining SaaS MVP using SLMs with positive feedback from 30+ CFOs.",
    skills: ["LLMs", "SaaS", "AI Automation"],
    buttons: [
      { label: "LinkedIn", icon: Linkedin, variant: "secondary" as const }
    ]
  },
  {
    title: "Wildfire Suppression Model",
    description: "Master thesis project developing MDP wildfire model with Monte-Carlo Tree Search optimization. Published first-author paper in Combustion Science & Technology.",
    skills: ["MCTS", "Optimization", "Research"],
    buttons: [
      { label: "Paper", icon: FileText, variant: "secondary" as const }
    ]
  },
  {
    title: "Biomechanical Exoskeleton",
    description: "Gravity-compensating shoulder exoskeleton for Long-COVID patients. Built with Arduino Mega, PID control, and conducted user testing.",
    skills: ["Arduino", "PID Control", "Biomechanics"],
    buttons: [
      { label: "Demo", icon: Youtube, variant: "secondary" as const }
    ]
  },
  {
    title: "Photos from Stratosphere",
    description: "High-altitude photography project capturing stunning images from the stratosphere using weather balloons and custom camera systems. Engineering challenge combining electronics, atmospheric physics, and photography.",
    skills: ["Electronics", "Photography", "Atmospheric Physics"],
    buttons: [
      { label: "Gallery", icon: Camera, variant: "secondary" as const },
    ]
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export default function Home() {
  const handleDownloadCV = () => {
    // Create a link to download the CV
    const link = document.createElement('a');
    link.href = '/cv.pdf';
    link.download = 'Jonas_Petersen_CV.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-glass border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
              JP
            </div>
          </div>
          <Button 
            onClick={handleDownloadCV}
            variant="outline" 
            size="sm"
            className="hover:border-primary/30 transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CV
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Jonas Petersen
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Computational engineer with AI/robotics expertise. Co-founded and scaled AI startup to €500k revenue. 
              Cambridge MPhil, Imperial MEng. Building the future of human-robot interaction.
            </p>
          </motion.div>
        </section>

        {/* About Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-card border-border p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">About Me</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I'm a German engineer and founder drawn to embodied AI, where robots learn to move and think like humans. 
                  My work spans developing advanced robotics systems to creating innovative AI solutions that solve real-world problems. 
                  I was educated at Imperial College and Cambridge University.
                </p>
                <p>
                  With a background in mechanical engineering and computing, I've led projects ranging from biomechanical 
                  exoskeletons to reinforcement learning training data pipelines. I co-founded and scaled a tech startup to 
                  €500k in revenues, less than 12 months out of uni. To me, solving embodied AI is the most challenging 
                  and enticing problem of our time.
                </p>
                <p>
                  Humanity is on track to be 100M workers short by 2030 alone due to our post-modern ageing society. 
                  Embodied AI can fix this. And I would like my future family to live a life as beautiful and better than 
                  what I am so grateful for living today. Extremely excited to be alive right now and make a dent!
                </p>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Projects Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <motion.h2 
            className="text-3xl font-bold text-foreground mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Featured Projects
          </motion.h2>

          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Featured project - human2robot - Full width */}
            <motion.div variants={itemVariants}>
              <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 p-8 relative border-primary/20">
                <div className="absolute -top-3 left-8">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-3">human2robot</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Coordination and data layer for the robotic age. Training data platform using imitation learning from human hand video recordings. Won 2 hackathons and secured YC interview.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {["Python", "ROS", "Isaac Gym", "Hugging Face", "Computer Vision"].map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-400 text-white border border-orange-500 hover:border-orange-400"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* K2 AI - Full width */}
            <motion.div variants={itemVariants}>
              <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-3">K2 AI</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Co-founded AI startup, scaled to 10 employees and &gt;€500k revenue. Developed task mining SaaS MVP using SLMs with positive feedback from 30+ CFOs.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {["LLMs", "SaaS", "AI Automation"].map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border border-border hover:border-orange-400/40 hover:text-orange-400 transition-all duration-200"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Grid for smaller projects */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* RL Projects */}
              <motion.div variants={itemVariants}>
                <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 p-6 h-full">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">RL Projects</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Reinforcement learning implementations including Monte Carlo Tree Search for wildfire suppression and autonomous control systems.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {["PyTorch", "MCTS", "OpenAI Gym"].map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="border border-border hover:border-orange-400/40 hover:text-orange-400 transition-all duration-200"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Wildfire Suppression Model */}
              <motion.div variants={itemVariants}>
                <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 p-6 h-full">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Wildfire Suppression Model</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Master thesis project developing MDP wildfire model with Monte-Carlo Tree Search optimization. Published first-author paper in Combustion Science & Technology.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {["MCTS", "Optimization", "Research"].map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="border border-border hover:border-orange-400/40 hover:text-orange-400 transition-all duration-200"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Paper
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Biomechanical Exoskeleton */}
              <motion.div variants={itemVariants}>
                <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 p-6 h-full">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Biomechanical Exoskeleton</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Gravity-compensating shoulder exoskeleton for Long-COVID patients. Built with Arduino Mega, PID control, and conducted user testing.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Arduino", "PID Control", "Biomechanics"].map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="border border-border hover:border-orange-400/40 hover:text-orange-400 transition-all duration-200"
                    >
                      <Youtube className="w-4 h-4 mr-2" />
                      Demo
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Photos from Stratosphere */}
              <motion.div variants={itemVariants}>
                <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 p-6 h-full">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Photos from Stratosphere</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      High-altitude photography project capturing stunning images from the stratosphere using weather balloons and custom camera systems. Engineering challenge combining electronics, atmospheric physics, and photography.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Electronics", "Photography", "Atmospheric Physics"].map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="border border-border hover:border-orange-400/40 hover:text-orange-400 transition-all duration-200"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Gallery
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Footer/Contact */}
        <motion.footer 
          className="max-w-4xl mx-auto px-6 py-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="border-t border-border pt-12">
            <p className="text-muted-foreground mb-6">Let's connect and build something amazing together</p>
            <div className="flex justify-center space-x-6 mb-8">
              <a 
                href="https://linkedin.com/in/jonas-petersen" 
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5" />
                <span className="font-medium">LinkedIn</span>
              </a>
              <a 
                href="https://github.com/jonas-petersen" 
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">GitHub</span>
              </a>
              <a 
                href="https://instagram.com/jonas.petersen" 
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5" />
                <span className="font-medium">Instagram</span>
              </a>
            </div>
            <p className="text-muted-foreground text-sm">© 2025 Jonas Petersen.</p>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}