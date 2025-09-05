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
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Bass-T</span>
            </div>
          </div>
          <Button 
            variant="default"
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            onClick={() => alert('Online shop coming soon!')}
          >
            Book / Shop
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="flex flex-col items-center">
            <img 
              src="/LinkedIn profile pic - shirt.png" 
              alt="Bass-T" 
              className="w-40 h-40 rounded-full object-cover mb-6 border-4 border-orange-500"
            />
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-white via-orange-400 to-orange-600 bg-clip-text text-transparent">
              Bass-T
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-6">
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
        <section className="max-w-4xl mx-auto px-6 pb-16 text-center" id="services">
          <h2 className="text-3xl font-bold text-white mb-8">Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-900 border-gray-800 p-8">
              <h3 className="text-xl font-bold text-orange-400 mb-3">Mixing</h3>
              <p className="text-gray-300">Professional mixing for artists, producers, and media. Clean, powerful sound tailored to your vision.</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-8">
              <h3 className="text-xl font-bold text-orange-400 mb-3">Mastering</h3>
              <p className="text-gray-300">Industry-standard mastering for release-ready tracks. Loud, clear, and competitive.</p>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-8">
              <h3 className="text-xl font-bold text-orange-400 mb-3">Production & DJ</h3>
              <p className="text-gray-300">Beatmaking, end-to-end song production, and DJ services for events, clubs, and private parties.</p>
            </Card>
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16 text-center" id="portfolio">
          <h2 className="text-3xl font-bold text-white mb-8">Portfolio Highlights</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gray-900 border-gray-800 p-8">
              <h3 className="text-xl font-bold text-orange-400 mb-3">Astra Rakete (Masl, Skyden)</h3>
              <p className="text-gray-300 mb-2">500,000+ listens on Spotify</p>
              <a href="https://open.spotify.com/track/1SNt5TkIJhdgjkOD00ezP8?si=84d349faacc14c43" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Listen</a>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-8">
              <h3 className="text-xl font-bold text-orange-400 mb-3">Tim River: Feel the tension</h3>
              <a href="https://open.spotify.com/track/0DAc0jmbnfuUTaTqfmFnlL" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Listen</a>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-8">
              <h3 className="text-xl font-bold text-orange-400 mb-3">LionKloud: Harmony</h3>
              <a href="https://open.spotify.com/track/6eYPukivyvDEoCiHrAz6Ld" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Listen</a>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-8">
              <h3 className="text-xl font-bold text-orange-400 mb-3">House of Amani: Uthando</h3>
              <a href="https://open.spotify.com/track/5Whh2yubxjPKTxFZfctCzF?si=Ks82hqHRQii0PnuElOjeog" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Listen</a>
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
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
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
                <span className="font-medium text-orange-400">Spotify</span>
              </a>
              <a href="https://www.youtube.com/@bass-t" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <span className="font-medium text-orange-400">YouTube</span>
              </a>
            </div>
            <p className="text-gray-600 text-sm">© 2025 Bass-T.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
