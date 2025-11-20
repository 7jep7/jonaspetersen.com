import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  Download, 
  Linkedin, 
  Star
} from "lucide-react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Calum Steer - Development & Conservation Professional" },
    { name: "description", content: "Programme Officer for environmental conservation and sustainable livelihoods at SEED Madagascar. MPhil Development Studies, Cambridge. Passionate about sustainable development, migration, investigative journalism and compassion in politics." },
    { name: "keywords", content: "Development Studies, Conservation, Sustainable Development, SEED Madagascar, Marine Conservation, Migration, Cambridge" },
    { property: "og:title", content: "Calum Steer - Development & Conservation Professional" },
    { property: "og:description", content: "Programme Officer for environmental conservation and sustainable livelihoods at SEED Madagascar. MPhil Development Studies, Cambridge. Passionate about sustainable development and social justice." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://calumsteer.com" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Calum Steer - Development & Conservation Professional" },
    { name: "twitter:description", content: "Programme Officer for environmental conservation and sustainable livelihoods at SEED Madagascar. MPhil Development Studies, Cambridge. Passionate about sustainable development and social justice." },
  ];
};

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
    link.download = 'Calum_Steer_CV.pdf';
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
              <span className="text-white font-bold text-lg">CS</span>
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
                  src="/calum-profile.jpg" 
                  alt="Calum Steer" 
                  className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-6 md:mt-auto">
                <a 
                  href="https://www.linkedin.com/in/calum-steer-8460b0149" 
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
                Hi, I'm Calum
              </h1>
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8 md:mb-0">
                  Programme Officer working on environmental conservation and sustainable livelihoods in Madagascar.
                  MPhil in Development Studies from Cambridge University.
                  First-class Geography degree from Durham University.&nbsp;
                    Passionate about{" "}
                    <span className="bg-orange-400 rounded px-1 font-bold" style={{ lineHeight: "1.5", paddingTop: "0.1em", paddingBottom: "0.1em" }}>
                      sustainable development
                    </span>
                    {" "}and social justice.
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
                  I'm a Programme Officer for <strong>environmental conservation and sustainable livelihoods</strong> at SEED Madagascar. 
                  I work with small-scale fishing communities in southeast Madagascar, supporting them to manage their marine environment 
                  through <strong>Locally Managed Marine Areas</strong>, promoting both prosperity and sustainability.
                </p>
                <p>
                  With an <strong>MPhil in Development Studies from Cambridge University</strong> and a <strong>first-class Geography degree 
                  from Durham University</strong>, I bring academic rigor to real-world development challenges. My experience spans the relief 
                  and development sectors, including work with <strong>UNRWA</strong> supporting Gaza emergency response and gender-based violence prevention, 
                  and as a caseworker helping asylum-seekers in the UK.
                </p>
                <p>
                  I'm passionate about <strong>sustainable development, migration, investigative journalism, and compassion in politics</strong>. 
                  I believe in the interconnected nature of global challenges—from corporate accountability abroad to migration policy at home—and 
                  the importance of international cooperation in addressing them. Through my work, I strive to support communities in building 
                  sustainable, dignified livelihoods while preserving the environment for future generations.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Experience Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Experience & Projects</h2>
          
          <div className="space-y-8">
            {/* SEED Madagascar - Featured */}
            <Card className="bg-gray-800 border-gray-700 p-8 relative">
              <div className="absolute -top-3 left-8">
                <Badge className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                  <Star className="w-3 h-3 mr-1" />
                  Current Role
                </Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-3">Programme Officer - Rural Livelihoods</h3>
                <p className="text-orange-400 font-medium mb-3">SEED Madagascar · Sep 2024 - Present</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Supporting small-scale fishing communities in southeast Madagascar through the Oratsimba project. 
                  By establishing Locally Managed Marine Areas (LMMAs), I help communities manage their marine environment, 
                  promoting both prosperity and environmental sustainability. Work involves community engagement, 
                  conservation planning, and sustainable livelihood development.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Marine Conservation</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Community Development</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Sustainable Livelihoods</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Cross-Cultural Communication</Badge>
              </div>
            </Card>

            {/* UNRWA */}
            <Card className="bg-gray-800 border-gray-700 p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-3">Intern - Emergency Response Support and Gender Division</h3>
                <p className="text-orange-400 font-medium mb-3">UNRWA · May 2024 - Sep 2024</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Supported Gaza emergency response operations and contributed to a major UNRWA report on gender-based violence. 
                  Participated in GBV workshop planning sessions and provided critical research and editorial support during a period of humanitarian crisis.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Emergency Response</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Gender-Based Violence</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Research</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">Humanitarian Aid</Badge>
              </div>
            </Card>

            {/* Additional Experience Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Teaching */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">Geography Teacher</h3>
                  <p className="text-orange-400 font-medium mb-3">Abingdon School · Oct 2023 - May 2024</p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Taught Geography at an independent school in Oxfordshire, including a two-term course on the Anthropocene. 
                    Led the school Geography Club conducting an investigation into the school's climate impact. Received extensive 
                    training on novel teaching methods and participated in curriculum development meetings.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Teaching</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Climate Education</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Curriculum Development</Badge>
                </div>
              </Card>

              {/* Action Foundation */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">Asylum-Seeker Caseworker</h3>
                  <p className="text-orange-400 font-medium mb-3">Action Foundation UK · Oct 2021 - Jun 2022</p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Worked at InterAction drop-in center for migrants, providing an accessible and supportive environment. 
                    Trained as a caseworker to help asylum-seekers access legal, health, and education services, minimizing 
                    feelings of isolation and connecting them to the local community.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Casework</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Vulnerable Populations</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Community Integration</Badge>
                </div>
              </Card>

              {/* Tearfund */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">Volunteer and Media Coordinator</h3>
                  <p className="text-orange-400 font-medium mb-3">Tearfund · Jan 2019 - Apr 2019</p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Spent three months volunteering in Tanzania, teaching geography and English in primary and secondary schools. 
                    Co-led an initiative to increase agroforestry in the region. Observed HIV support groups and community 
                    mobilization meetings. Contributed to Tearfund social media and blog content.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">International Development</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Agroforestry</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Content Creation</Badge>
                </div>
              </Card>

              {/* Education */}
              <Card className="bg-gray-800 border-gray-700 p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">Education</h3>
                  <div className="space-y-3 text-gray-300 leading-relaxed">
                    <div>
                      <p className="font-semibold text-white">MPhil Development Studies</p>
                      <p className="text-sm text-orange-400">University of Cambridge · 2022-2023</p>
                      <p className="text-sm">Grade: 72</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">BA Geography</p>
                      <p className="text-sm text-orange-400">Durham University · 2019-2022</p>
                      <p className="text-sm">First-class Honours (75)</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Development Studies</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Geography</Badge>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">Research</Badge>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="border-t border-gray-700 pt-12">
            <p className="text-gray-300 mb-6">Let's connect and work towards a more sustainable and just world</p>
            <div className="flex justify-center space-x-6 mb-8">
              <a 
                href="https://www.linkedin.com/in/calum-steer-8460b0149" 
                className="flex items-center space-x-2 text-gray-300 hover:text-orange-500 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5" />
                <span className="font-medium">LinkedIn</span>
              </a>
            </div>
            <p className="text-gray-400 text-sm">© 2025 Calum Steer.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
