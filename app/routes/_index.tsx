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
  const [showShopNotification, setShowShopNotification] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShopClick = () => {
    setShowShopNotification(true);
    setTimeout(() => setShowShopNotification(false), 3000);
  };

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
          <div className="flex items-center space-x-4">
            <a 
              href="https://www.instagram.com/bass_t.pt/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-sm font-medium">Contact</span>
            </a>
            <Button 
              variant="outline"
              size="sm"
              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white font-semibold transition-colors duration-200"
              onClick={handleShopClick}
            >
              Book / Shop
            </Button>
          </div>
        </div>
      </header>

      {/* Subtle Shop Notification */}
      {showShopNotification && (
        <div className="fixed top-20 right-6 z-50 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-right-2 fade-in duration-300">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-200">Online shop coming soon</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative max-w-4xl mx-auto px-6 py-16">
          {/* Background Image */}
          <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
            <img 
              src="/images/mixing-console.jpg" 
              alt="Professional Studio" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gray-950/80"></div>
          </div>
          
          {/* Desktop Layout: Left Image, Right Text */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
            {/* Left Side - Image and Social Icons */}
            <div className="flex flex-col items-center">
              <img 
                src="/sebastian-producer-foto.jpeg" 
                alt="Sebastian Petersen (Bass-T)" 
                className="w-44 h-44 lg:w-52 lg:h-52 rounded-2xl object-cover mb-6 border-3 border-green-500/60 shadow-2xl"
              />
              {/* Social Icons - Centered Below Image */}
              <div className="flex justify-center space-x-6">
                <a 
                  href="https://open.spotify.com/artist/40j4uphVTGSVb4EUtLbZ2l" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-green-400 transition-colors duration-200"
                  aria-label="Spotify"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/bass_t.pt/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-green-400 transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.youtube.com/@bass-t" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-green-400 transition-colors duration-200"
                  aria-label="YouTube"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Side - Text and CTA */}
            <div className="flex-1 text-center lg:text-left lg:pl-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white via-green-200 to-green-400 bg-clip-text text-transparent">
                Bass-T
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 leading-relaxed mb-8 max-w-2xl lg:max-w-none">
                Bringing your musical vision to life. <br />
                <span className="text-green-300 font-medium">Premium mixing • Mastering • Production • Live DJ sets</span>
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <a 
                  href="#services" 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </a>
                <a 
                  href="https://www.instagram.com/bass_t.pt/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="border-2 border-green-600 hover:bg-green-600 text-green-400 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300"
                >
                  Collaborate
                </a>
              </div>
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

        {/* Projects Section */}
        <section className="max-w-6xl mx-auto px-6 pb-20 text-center" id="portfolio">
          <h2 className="text-4xl font-bold text-white mb-12">Projects</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* House of Amani - Featured */}
            <Card className="md:col-span-2 lg:col-span-1 border-green-500/30 p-6 overflow-hidden backdrop-blur-sm transition-all duration-300 ring-1 ring-green-500/20" style={{backgroundColor: '#111827'}}>
              {/* Spotify Embed replacing image */}
              <div className="w-full mb-4">
                <iframe 
                  src="https://open.spotify.com/embed/track/5Whh2yubxjPKTxFZfctCzF?utm_source=generator&theme=0" 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  className="rounded-lg opacity-95 hover:opacity-100 transition-opacity duration-200 bg-gray-900"
                  style={{backgroundColor: '#111827'}}
                ></iframe>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-green-600/25 text-green-300 rounded-full text-xs font-medium border border-green-500/30">Song Production</span>
                <a 
                  href="https://open.spotify.com/artist/4YYa2gJGOWx9YnxVRYEOAT" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs font-medium hover:bg-blue-600/30 transition-colors duration-200 cursor-pointer border border-blue-500/30"
                >
                  House of Amani
                </a>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <a 
                  href="https://open.spotify.com/track/5Whh2yubxjPKTxFZfctCzF?si=Ks82hqHRQii0PnuElOjeog" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 hover:scale-110 transform flex-shrink-0"
                  aria-label="Listen on Spotify"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-green-300 text-left">Uthando</h3>
                  <p className="text-gray-300 text-sm leading-relaxed text-left">Full production & mixing • Featured collaboration</p>
                </div>
              </div>
            </Card>

            {/* House of Amani - My Soul */}
            <Card className="border-gray-700 p-6 overflow-hidden backdrop-blur-sm transition-all duration-300" style={{backgroundColor: '#111827'}}>
              {/* Spotify Embed replacing image */}
              <div className="w-full mb-4">
                <iframe 
                  src="https://open.spotify.com/embed/track/3bwiMEf4F1zLhI63eUXpDn?utm_source=generator&theme=0" 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  className="rounded-lg opacity-95 hover:opacity-100 transition-opacity duration-200 bg-gray-900"
                  style={{backgroundColor: '#111827'}}
                ></iframe>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">Song Production</span>
                <a 
                  href="https://open.spotify.com/artist/4YYa2gJGOWx9YnxVRYEOAT" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium hover:bg-blue-600/30 transition-colors duration-200 cursor-pointer"
                >
                  House of Amani
                </a>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <a 
                  href="https://open.spotify.com/track/3bwiMEf4F1zLhI63eUXpDn" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 hover:scale-110 transform flex-shrink-0"
                  aria-label="Listen on Spotify"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-green-400 text-left">My Soul</h3>
                  <p className="text-gray-300 text-sm leading-relaxed text-left">Professional mixing & production collaboration</p>
                </div>
              </div>
            </Card>

            {/* Astra Rakete */}
            <Card className="border-gray-700 p-6 overflow-hidden backdrop-blur-sm transition-all duration-300" style={{backgroundColor: '#111827'}}>
              {/* Spotify Embed replacing image */}
              <div className="w-full mb-4">
                <iframe 
                  src="https://open.spotify.com/embed/track/1SNt5TkIJhdgjkOD00ezP8?utm_source=generator&theme=0" 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  className="rounded-lg opacity-95 hover:opacity-100 transition-opacity duration-200 bg-gray-900"
                  style={{backgroundColor: '#111827'}}
                ></iframe>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">Song Production</span>
                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium">Masl, Skyden</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <a 
                  href="https://open.spotify.com/track/1SNt5TkIJhdgjkOD00ezP8?si=84d349faacc14c43" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 hover:scale-110 transform flex-shrink-0"
                  aria-label="Listen on Spotify"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-green-400 text-left">Astra Rakete</h3>
                  <p className="text-gray-300 text-sm leading-relaxed text-left">500,000+ listens on Spotify</p>
                </div>
              </div>
            </Card>

            {/* Tim River */}
            <Card className="border-gray-700 p-6 overflow-hidden backdrop-blur-sm transition-all duration-300" style={{backgroundColor: '#111827'}}>
              {/* Spotify Embed replacing image */}
              <div className="w-full mb-4">
                <iframe 
                  src="https://open.spotify.com/embed/track/0DAc0jmbnfuUTaTqfmFnlL?utm_source=generator&theme=0" 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  className="rounded-lg opacity-95 hover:opacity-100 transition-opacity duration-200 bg-gray-900"
                  style={{backgroundColor: '#111827'}}
                ></iframe>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">Song Production</span>
                <a 
                  href="https://open.spotify.com/artist/7L6K3hhWa44dPBZLUWs8lG" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium hover:bg-blue-600/30 transition-colors duration-200 cursor-pointer"
                >
                  Tim River
                </a>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <a 
                  href="https://open.spotify.com/track/0DAc0jmbnfuUTaTqfmFnlL" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 hover:scale-110 transform flex-shrink-0"
                  aria-label="Listen on Spotify"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-green-400 text-left">Feel the tension</h3>
                  <p className="text-gray-300 text-sm leading-relaxed text-left">Professional mixing & production</p>
                </div>
              </div>
            </Card>

            {/* LionKloud */}
            <Card className="border-gray-700 p-6 overflow-hidden backdrop-blur-sm transition-all duration-300" style={{backgroundColor: '#111827'}}>
              {/* Spotify Embed replacing image */}
              <div className="w-full mb-4">
                <iframe 
                  src="https://open.spotify.com/embed/track/6eYPukivyvDEoCiHrAz6Ld?utm_source=generator&theme=0" 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  className="rounded-lg opacity-95 hover:opacity-100 transition-opacity duration-200 bg-gray-900"
                  style={{backgroundColor: '#111827'}}
                ></iframe>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">Song Production</span>
                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium">LionKloud</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <a 
                  href="https://open.spotify.com/track/6eYPukivyvDEoCiHrAz6Ld" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 hover:scale-110 transform flex-shrink-0"
                  aria-label="Listen on Spotify"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-green-400 text-left">Harmony</h3>
                  <p className="text-gray-300 text-sm leading-relaxed text-left">Mastered for commercial release</p>
                </div>
              </div>
            </Card>

            {/* Gymnasium Wentorf Ad Video */}
            <Card className="border-gray-700 p-6 overflow-hidden backdrop-blur-sm transition-all duration-300" style={{backgroundColor: '#111827'}}>
              <div className="w-full h-40 mb-4 rounded-lg overflow-hidden">
                <img 
                  src="/images/ad-video-production.jpg" 
                  alt="Gymnasium Wentorf Summer Concert Ad" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-amber-600/20 text-amber-400 rounded-full text-xs font-medium">Promo Video Soundtrack</span>
                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium">Gymnasium Wentorf</span>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">Summer Concert Promo</h3>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">Music production for promotional video in collaboration with Dingenskirchen agency</p>
            </Card>

            {/* Wedding DJ */}
            <Card className="border-gray-700 p-6 overflow-hidden backdrop-blur-sm transition-all duration-300" style={{backgroundColor: '#111827'}}>
              <div className="w-full h-40 mb-4 rounded-lg overflow-hidden">
                <img 
                  src="/images/wedding-dj.jpg" 
                  alt="Wedding DJ Performance" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium">DJ Gig</span>
                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium">Private Wedding</span>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">Elegant Wedding</h3>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">150 guests • Complete sound & lighting setup • 8-hour performance</p>
            </Card>

            {/* Nightclub DJ */}
            <Card className="border-gray-700 p-6 overflow-hidden backdrop-blur-sm transition-all duration-300" style={{backgroundColor: '#111827'}}>
              <div className="w-full h-40 mb-4 rounded-lg overflow-hidden">
                <img 
                  src="/images/nightclub-dj.jpg" 
                  alt="Nightclub DJ Performance" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium">DJ Gig</span>
                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium">Club Halo Hamburg</span>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">Saturday Night Set</h3>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">200+ guests • High-energy electronic set • Collaboration with Nicnames</p>
            </Card>

            {/* Birthday Party DJ */}
            <Card className="border-gray-700 p-6 overflow-hidden backdrop-blur-sm transition-all duration-300" style={{backgroundColor: '#111827'}}>
              <div className="w-full h-40 mb-4 rounded-lg overflow-hidden">
                <img 
                  src="/images/birthday-party-dj.jpg" 
                  alt="Birthday Party DJ Performance" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium">DJ Gig</span>
                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium">Event Center Frankfurt</span>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">30th Birthday Celebration</h3>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">120 guests • Mixed genre playlist • Solo performance with full setup</p>
            </Card>
          </div>
        </section>

        {/* About Section */}
        <section className="max-w-4xl mx-auto px-6 pb-20" id="about">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">About</h2>
          
          {/* Text Above Iframe */}
          <div className="text-gray-200 leading-relaxed text-center mb-8">
            <p className="text-lg mb-6">
              I'm <span className="text-green-400 font-semibold">Sebastian Petersen</span>, 24 years old and based in Hamburg, Germany. 
              Music has been my life's passion since I took my first piano lesson at age 3, followed by violin at 5.
            </p>
            
            <p className="text-lg mb-6">
              Growing up with music teacher parents, I was surrounded by everything from classical masterpieces to contemporary sounds.
              Ten years ago, I discovered electronic music production and found my true calling. The piece below perfectly captures the balance of technical mastery and emotional depth that inspires my approach to audio engineering.
            </p>
          </div>

          {/* Full-Width Musical Inspiration */}
          <div className="border border-gray-700 rounded-2xl p-6 mb-8 backdrop-blur-sm" style={{backgroundColor: '#111827'}}>
            <iframe 
              src="https://open.spotify.com/embed/track/2tUZnbP0VmFYYGQOWznpjf?utm_source=generator&theme=0" 
              width="100%" 
              height="152" 
              frameBorder="0" 
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              className="rounded-lg"
              style={{backgroundColor: '#111827'}}
            ></iframe>
          </div>

          {/* Text Below Iframe */}
          <div className="text-gray-200 leading-relaxed text-center">
            <p className="text-lg mb-6">
              This led me to formal education as an Audio Engineer at the <span className="text-green-400">SAE Institute in Hanover (2018-2021)</span>,
              where I refined my technical skills and deepened my understanding of sound design.
            </p>
            
            <p className="text-lg">
              Today, I'm living my dream – creating art through sound while bringing people together through music. 
              <span className="text-green-300 block mt-4 font-medium text-xl">Every track tells a story, every mix builds a bridge.</span>
            </p>
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
            <div className="flex justify-center space-x-8 mb-8">
              <a 
                href="https://open.spotify.com/artist/40j4uphVTGSVb4EUtLbZ2l" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors duration-200"
                aria-label="Spotify"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span className="font-medium text-sm">Spotify</span>
              </a>
              <a 
                href="https://www.youtube.com/@bass-t" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors duration-200"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="font-medium text-sm">YouTube</span>
              </a>
              <a 
                href="https://www.instagram.com/bass_t.pt/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors duration-200"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="font-medium text-sm">Instagram</span>
              </a>
              <a 
                href="mailto:sepetersen@outlook.de" 
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors duration-200"
                aria-label="Email"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="font-medium text-sm">Email</span>
              </a>
            </div>
            <p className="text-gray-600 text-sm">© 2025 Bass-T.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
