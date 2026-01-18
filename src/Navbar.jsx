import { useState, useEffect } from "react";

const Navbar = ({ hidden = false }) => {
  if (hidden) return null;

  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => setActive(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 py-6 flex items-center justify-between px-6 md:px-12 pointer-events-auto">
      {/* Logo */}
      <div className="logo">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wider mix-blend-difference">
          
        </h1>
      </div>

      {/* Menu */}
      <ul
        className={`flex items-center sm:gap-8 gap-4 
          absolute left-1/2 -translate-x-1/2 
          bg-black/20 backdrop-blur-lg border border-white/10
          px-8 py-3 rounded-full
          transition-all duration-500 ease-in-out
          ${active ? "top-4 opacity-100" : "-top-20 opacity-0"}`}
      >
        <li><a href="#hero" className="text-sm md:text-base font-medium text-white/80 hover:text-white transition">Home</a></li>
        <li><a href="#skills" className="text-sm md:text-base font-medium text-white/80 hover:text-white transition">Skills</a></li>
        <li><a href="#projects" className="text-sm md:text-base font-medium text-white/80 hover:text-white transition">Works</a></li>
        <li><a href="#contact" className="text-sm md:text-base font-medium text-white/80 hover:text-white transition">Contact</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;