import { Link } from "react-router";

/**
 * Minimalist Universal Footer for SpellyCraft
 * Conforms to SpellyCraft brand rules:
 * - Minimal, distraction-free design
 * - Copyright & domain credit
 * - Microsoft Edge TTS technology attribution
 * - Navigation links (About, Contact, Support)
 */
export default function MinimalFooter() {
  return (
    <footer className="border-t border-plum/15 bg-white py-5 text-xs text-muted-label w-full select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
          <span className="font-bold text-plum">SpellyCraft</span>
          <span className="hidden sm:inline text-plum/30">•</span>
          <span>© {new Date().getFullYear()} SpellyCraft (spellycraft.com). All rights reserved.</span>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 text-[11px]">
          <span>Speech synthesized via</span>
          <span className="font-semibold text-body-dark">Microsoft Edge Neural TTS</span>
        </div>

        <div className="flex items-center space-x-4 font-medium text-body-dark text-xs">
          <Link to="/about" className="hover:text-plum transition">
            About
          </Link>
          <Link to="/contact" className="hover:text-plum transition">
            Contact
          </Link>
          <Link to="/support-us" className="text-plum hover:underline font-bold transition">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
