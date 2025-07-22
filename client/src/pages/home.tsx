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
  size?: "large" | "small";
}

const projects: Project[] = [
  {
    title: "human2robot",
    description: "Coordination and data layer for the robotic age. Training data platform using imitation learning from human hand video recordings. Won 2 hackathons and secured YC interview.",
    skills: ["Python", "ROS", "Isaac Gym", "Hugging Face", "Computer Vision"],
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
    title: "RL Projects",
    description: "Reinforcement learning implementations including Monte Carlo Tree Search for wildfire suppression and autonomous control systems.",
    skills: ["PyTorch", "MCTS", "OpenAI Gym"],
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

  const largeProjects = projects.filter(p => p.size === "large");
  const smallProjects = projects.filter(p => p.size === "small");

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
            {/* Large projects - full width */}
            {largeProjects.map((project) => (
              <motion.div key={project.title} variants={itemVariants}>
                <Card className={`bg-card border-border hover:border-primary/30 transition-all duration-300 p-8 relative ${
                  project.featured ? 'border-primary/20' : ''
                }`}>
                  {project.featured && (
                    <div className="absolute -top-3 left-8">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-3">{project.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {project.buttons.map((button, buttonIndex) => {
                      const IconComponent = button.icon;
                      return (
                        <Button
                          key={buttonIndex}
                          variant={button.variant}
                          size="sm"
                          onClick={() => button.href && window.open(button.href, '_blank')}
                          className={`border transition-all duration-200 ${
                            button.variant === 'default' 
                              ? 'bg-orange-500 hover:bg-orange-400 text-white border-orange-500 hover:border-orange-400' 
                              : 'border-border hover:border-orange-400/40 hover:text-orange-400'
                          }`}
                        >
                          <IconComponent className="w-4 h-4 mr-2" />
                          {button.label}
                        </Button>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Small projects - two-column grid */}
            <motion.div 
              className="grid md:grid-cols-2 gap-8"
              variants={containerVariants}
            >
              {smallProjects.map((project) => (
                <motion.div key={project.title} variants={itemVariants}>
                  <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 p-6 h-full">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground mb-3">{project.title}</h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {project.buttons.map((button, buttonIndex) => {
                        const IconComponent = button.icon;
                        return (
                          <Button
                            key={buttonIndex}
                            variant={button.variant}
                            size="sm"
                            onClick={() => button.href && window.open(button.href, '_blank')}
                            className="border border-border hover:border-orange-400/40 hover:text-orange-400 transition-all duration-200"
                          >
                            <IconComponent className="w-4 h-4 mr-2" />
                            {button.label}
                          </Button>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
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
                href="https://linkedin.com/in/jep7" 
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5" />
                <span className="font-medium">LinkedIn</span>
              </a>
              <a 
                href="https://github.com/7jep7" 
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">GitHub</span>
              </a>
              <a 
                href="https://instagram.com/7jep7" 
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