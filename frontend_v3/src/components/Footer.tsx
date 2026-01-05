import { Activity } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-secondary-foreground">NeuroAssist</span>
          </div>
          
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
              Support
            </a>
            <a href="#" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
              Contact
            </a>
          </nav>
        </div>
        
        <div className="mt-8 pt-8 border-t border-secondary-foreground/10 text-center text-sm text-secondary-foreground/60">
          © {new Date().getFullYear()} NeuroAssist. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
