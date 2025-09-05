import React, { useEffect, useState } from "react";

export default function Navbar() {
  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Portfolio", href: "#portfolio" },
    { name: "Services", href: "#services" },
    { name: "Contact", href: "#contact" },
  ];

  const [active, setActive] = useState<string>("home");
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const offsets = navItems.map(({ href }) => {
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (!el) return { id, top: Infinity };
        const rect = el.getBoundingClientRect();
        return { id, top: Math.abs(rect.top) };
      });
      const closest = offsets.reduce((a, b) => (a.top < b.top ? a : b));
      setActive(closest.id);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // set on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems]);

  // Toggle dark mode
  const toggleDark = () => {
    setDark(d => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      setActive(id);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b ${
      dark 
        ? 'bg-gray-900/60 backdrop-blur-2xl border-gray-600/20 shadow-xl shadow-black/10' 
        : 'bg-gray-800/70 backdrop-blur-md border-gray-700/50'
    }`}>
      <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center cursor-pointer"
               onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="text-white font-bold text-lg">Bass-T</span>
          </div>
          <a href="https://open.spotify.com/artist/40j4uphVTGSVb4EUtLbZ2l" target="_blank" rel="noopener noreferrer" aria-label="Spotify">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1DB954"/><path d="M17.25 16.5c-.25 0-.4-.1-.6-.2-1.6-1-3.6-1.2-6.1-.7-.3.1-.6-.2-.7-.5-.1-.3.2-.6.5-.7 2.7-.5 4.9-.3 6.7.8.3.2.4.6.2.9-.1.2-.3.2-.5.2zm.8-2.1c-.3 0-.5-.1-.7-.2-1.8-1.1-4.7-1.4-6.9-.8-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 2.5-.6 5.7-.3 7.8.9.4.2.5.7.3 1.1-.2.2-.4.4-.7.4zm.9-2.2c-.2 0-.3 0-.5-.1-2.1-1.3-6-1.4-8.1-.8-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 2.5-.6 6.7-.5 9.1 1 .5.3.7.9.4 1.4-.2.3-.5.3-.6.3zm-7.2 4.2c0 .5-.4.9-.9.9-.5 0-.9-.4-.9-.9s.4-.9.9-.9c.5 0 .9.4.9.9z" fill="#fff"/></svg>
          </a>
          <a href="https://www.youtube.com/@bass-t" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#FF0000"/><path d="M17.5 9.5c-.2-.7-.7-1.2-1.4-1.3C15.1 8 12 8 12 8s-3.1 0-4.1.2c-.7.1-1.2.6-1.4 1.3C6 10.5 6 12 6 12s0 1.5.2 2.5c.2.7.7 1.2 1.4 1.3C8.9 16 12 16 12 16s3.1 0 4.1-.2c.7-.1 1.2-.6 1.4-1.3.2-1 .2-2.5.2-2.5s0-1.5-.2-2.5zm-6 4V11l4 1.5-4 1.5z" fill="#fff"/></svg>
          </a>
        </div>
        <ul className="flex space-x-6 text-sm font-medium">
          {navItems.map(({ name, href }) => {
            const id = href.slice(1);
            return (
              <li key={name}>
                <a
                  href={href}
                  onClick={e => handleClick(e, href)}
                  className={`text-gray-300 hover:text-orange-500 transition-colors duration-200 ${
                    active === id ? "text-orange-500" : ""
                  }`}
                >
                  {name}
                </a>
              </li>
            );
          })}
        </ul>
        <button
          onClick={toggleDark}
          className="ml-4 p-2 rounded-full bg-transparent hover:bg-gray-700/40 text-xl transition-colors text-gray-300"
          aria-label="Toggle dark mode"
        >
          {dark ? "☾" : "◑"}
        </button>
      </div>
    </nav>
  );
}