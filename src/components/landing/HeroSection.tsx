import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, BarChart3 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/30" />
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-[10%] w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-pulse-subtle" />
      <div className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1.5s' }} />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 mb-8">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">Exam-Grade Security</span>
          </div>
          
          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            Secure Assessments,
            <span className="block text-primary/80">Trusted Results</span>
          </h1>
          
          {/* Subheadline */}
          <p className="animate-fade-up-delay-2 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            QuizoraX is a backend-first quiz and survey platform built for academic integrity. 
            Mandatory identity verification, strict access control, and automatic evaluation — 
            all enforced at the server level.
          </p>
          
          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button variant="accent" size="xl" className="w-full sm:w-auto">
              Create Your First Quiz
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
              See How It Works
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="animate-fade-up-delay-3 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">Backend-Enforced</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Clock className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">Timed Assessments</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <BarChart3 className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">Instant Analytics</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
