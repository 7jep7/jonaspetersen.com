import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export const loader = () => {
  return {};
};

export const meta = () => [
  { title: "Bass-T — Audio Engineer & Producer" },
  { name: "description", content: "Professional mixing, mastering, production, and DJ services. Portfolio highlights and booking for artists, advertisers, and events." },
  { property: "og:title", content: "Bass-T — Audio Engineer & Producer" },
  { property: "og:description", content: "Professional mixing, mastering, production, and DJ services. Portfolio highlights and booking for artists, advertisers, and events." },
  { property: "og:type", content: "website" },
  { property: "og:url", content: "https://bass-t.com" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: "Bass-T — Audio Engineer & Producer" },
  { name: "twitter:description", content: "Professional mixing, mastering, production, and DJ services. Portfolio highlights and booking for artists, advertisers, and events." },
];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b ${
        isScrolled 
          ? 'bg-gray-950/80 backdrop-blur-2xl border-gray-700/20 shadow-xl shadow-black/10' 
          : 'bg-gray-900/90 backdrop-blur-md border-gray-800/50'
      }`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="px-4 py-2 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm whitespace-nowrap">Bass-T</span>
            </div>
          </div>
          <Button 
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={() => alert('Online shop coming soon!')}
          >
            Book / Shop
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          {/* Background Image */}
          <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
            <img 
              src="/images/mixing-console.jpg" 
              alt="Professional Studio" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gray-950/80"></div>
          </div>
          
          <div className="relative flex flex-col items-center">
            <img 
              src="/LinkedIn profile pic - shirt.png" 
              alt="Sebastian Petersen (Bass-T)" 
              className="w-44 h-44 rounded-full object-cover mb-8 border-4 border-green-500 shadow-2xl"
            />
            <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white via-gray-100 to-green-400 bg-clip-text text-transparent">
              Bass-T
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed mb-8 max-w-3xl">
              Audio engineer & producer. Mixing, mastering, beatmaking, DJ services. <br />
              Professional, clean, and modern sound for artists, advertisers, and events.
            </p>
            <div className="flex justify-center space-x-4 mb-4">
              <a href="https://open.spotify.com/artist/40j4uphVTGSVb4EUtLbZ2l" target="_blank" rel="noopener noreferrer" aria-label="Spotify">
                <span className="sr-only">Spotify</span>
              </a>
              <a href="https://www.youtube.com/@bass-t" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <span className="sr-only">YouTube</span>
              </a>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="max-w-4xl mx-auto px-6 pb-20 text-center" id="services">
          <h2 className="text-4xl font-bold text-white mb-12">Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-900/70 border-gray-700 p-8 overflow-hidden backdrop-blur-sm hover:bg-gray-900/90 transition-all duration-300">
              <div className="w-full h-40 mb-6 rounded-lg overflow-hidden">
                <img 
                  src="/images/services/mixing-service.jpg" 
                  alt="Professional Mixing" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-4">Mixing</h3>
              <p className="text-gray-300 leading-relaxed">Professional mixing for artists, producers, and media. Clean, powerful sound tailored to your vision.</p>
            </Card>
            <Card className="bg-gray-900/70 border-gray-700 p-8 overflow-hidden backdrop-blur-sm hover:bg-gray-900/90 transition-all duration-300">
              <div className="w-full h-40 mb-6 rounded-lg overflow-hidden">
                <img 
                  src="/images/services/mastering-service.jpg" 
                  alt="Professional Mastering" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-4">Mastering</h3>
              <p className="text-gray-300 leading-relaxed">Industry-standard mastering for release-ready tracks. Loud, clear, and competitive.</p>
            </Card>
            <Card className="bg-gray-900/70 border-gray-700 p-8 overflow-hidden backdrop-blur-sm hover:bg-gray-900/90 transition-all duration-300">
              <div className="w-full h-40 mb-6 rounded-lg overflow-hidden">
                <img 
                  src="/images/services/dj-service.jpg" 
                  alt="DJ Services" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-4">Production & DJ</h3>
              <p className="text-gray-300 leading-relaxed">Beatmaking, end-to-end song production, and DJ services for events, clubs, and private parties.</p>
            </Card>
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="max-w-4xl mx-auto px-6 pb-20 text-center" id="portfolio">
          <h2 className="text-4xl font-bold text-white mb-12">Portfolio Highlights</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gray-900/70 border-gray-700 p-8 overflow-hidden backdrop-blur-sm hover:bg-gray-900/90 transition-all duration-300">
              <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                <img 
                  src="/images/portfolio/music-album-1.jpg" 
                  alt="Astra Rakete Album Cover" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-3">Astra Rakete (Masl, Skyden)</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">500,000+ listens on Spotify</p>
              <a 
                href="https://open.spotify.com/track/1SNt5TkIJhdgjkOD00ezP8?si=84d349faacc14c43" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 hover:scale-110 transform"
                aria-label="Listen on Spotify"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            </Card>
            <Card className="bg-gray-900/70 border-gray-700 p-8 overflow-hidden backdrop-blur-sm hover:bg-gray-900/90 transition-all duration-300">
              <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                <img 
                  src="/images/portfolio/music-album-2.jpg" 
                  alt="Tim River Album Cover" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-3">Tim River: Feel the tension</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">Professional mixing & production</p>
              <a 
                href="https://open.spotify.com/track/0DAc0jmbnfuUTaTqfmFnlL" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 hover:scale-110 transform"
                aria-label="Listen on Spotify"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            </Card>
            <Card className="bg-gray-900/70 border-gray-700 p-8 overflow-hidden backdrop-blur-sm hover:bg-gray-900/90 transition-all duration-300">
              <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                <img 
                  src="/images/studio-setup.jpg" 
                  alt="LionKloud Album Cover" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-3">LionKloud: Harmony</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">Mastered for commercial release</p>
              <a 
                href="https://open.spotify.com/track/6eYPukivyvDEoCiHrAz6Ld" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 hover:scale-110 transform"
                aria-label="Listen on Spotify"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            </Card>
            <Card className="bg-gray-900/70 border-gray-700 p-8 overflow-hidden backdrop-blur-sm hover:bg-gray-900/90 transition-all duration-300">
              <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                <img 
                  src="/images/headphones-studio.jpg" 
                  alt="House of Amani Album Cover" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-3">House of Amani: Uthando</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">Full production & mixing</p>
              <a 
                href="https://open.spotify.com/track/5Whh2yubxjPKTxFZfctCzF?si=Ks82hqHRQii0PnuElOjeog" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 hover:scale-110 transform"
                aria-label="Listen on Spotify"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16 text-center" id="contact">
          <h2 className="text-3xl font-bold text-white mb-8">Contact</h2>
          <p className="text-gray-300 mb-6">Ready to elevate your sound? Reach out for mixing, mastering, production, or DJ bookings.</p>
          <Button 
            variant="default"
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={() => window.location.href = 'mailto:bass-t@bass-t.com'}
          >
            Contact Bass-T
          </Button>
        </section>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="border-t border-gray-800 pt-12">
            <p className="text-gray-400 mb-6">Let's create something powerful together.</p>
            <div className="flex justify-center space-x-6 mb-8">
              <a href="https://open.spotify.com/artist/40j4uphVTGSVb4EUtLbZ2l" target="_blank" rel="noopener noreferrer" aria-label="Spotify">
                <span className="font-medium text-green-400 hover:text-green-300 transition-colors">Spotify</span>
              </a>
              <a href="https://www.youtube.com/@bass-t" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <span className="font-medium text-green-400 hover:text-green-300 transition-colors">YouTube</span>
              </a>
            </div>
            <p className="text-gray-600 text-sm">© 2025 Bass-T.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
