import { GraduationCap, Shield, Loader2 } from "lucide-react";
import { useFooterContent } from "@/hooks/useFooterContent";

const Footer = () => {
  const { content, getLinksBySection, loading } = useFooterContent();
  
  const platformLinks = getLinksBySection('platform');
  const supportLinks = getLinksBySection('support');

  if (loading) {
    return (
      <footer className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-primary text-primary-foreground py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8 lg:mb-12">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">{content.brand_name}</span>
            </div>
            <p className="text-primary-foreground/70 mb-6 max-w-sm leading-relaxed text-sm sm:text-base">
              {content.brand_description}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-xs sm:text-sm text-primary-foreground/70">Backend-Enforced Security</span>
            </div>
          </div>
          
          {/* Platform Links */}
          {platformLinks.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-3">
                {platformLinks.map((link) => (
                  <li key={link.id}>
                    <a 
                      href={link.url} 
                      className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Support Links */}
          {supportLinks.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.id}>
                    <a 
                      href={link.url} 
                      className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-primary-foreground/50 text-center sm:text-left">
            © {new Date().getFullYear()} {content.brand_name}. {content.copyright_text}
          </p>
          <p className="text-xs sm:text-sm text-primary-foreground/50 text-center sm:text-right">
            {content.tagline}, by Codedevio.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
