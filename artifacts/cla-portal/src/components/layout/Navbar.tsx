import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Shield, Map, Activity, Database, AlertCircle } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Tech", href: "#tech" },
    { name: "Missing Board", href: "#board" },
    { name: "Report", href: "#report" },
    { name: "Enrollment", href: "#enrollment" },
    { name: "GPS Tracker", href: "#tracker" },
    { name: "Portal", href: "#portal" },
    { name: "Weapons", href: "#weapons" },
    { name: "Status", href: "#status" },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border ${scrolled ? "bg-background/95 backdrop-blur-md shadow-md" : "bg-background"}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-wider">
            <Shield className="w-6 h-6" />
            <span>CLA COMMAND</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono tracking-tight uppercase"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
