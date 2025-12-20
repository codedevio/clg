import { Shield, Server, Lock, Eye, AlertTriangle, Database } from "lucide-react";

const securityFeatures = [
  {
    icon: Server,
    title: "Server-Side Validation",
    description: "Every rule, timer, and calculation runs on the server. The frontend is just a display layer.",
  },
  {
    icon: Lock,
    title: "JWT Authentication",
    description: "Admins and teachers use secure JWT tokens. Students get temporary attempt tokens with limited scope.",
  },
  {
    icon: Eye,
    title: "Answer Protection",
    description: "Correct answers are never exposed through APIs. Evaluation happens entirely server-side.",
  },
  {
    icon: AlertTriangle,
    title: "Anti-Cheat Logging",
    description: "Tab switches, session times, and suspicious activity are logged for every attempt.",
  },
  {
    icon: Database,
    title: "Immutable Records",
    description: "Once submitted, attempts and results cannot be modified. Full audit trail maintained.",
  },
  {
    icon: Shield,
    title: "Input Sanitization",
    description: "All inputs are validated and sanitized. Rate limiting prevents abuse and brute force attacks.",
  },
];

const SecuritySection = () => {
  return (
    <section id="security" className="py-24 lg:py-32 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/90 text-sm font-medium mb-4">
            Security
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Exam-Grade Security Architecture
          </h2>
          <p className="text-lg text-primary-foreground/70 leading-relaxed">
            QuizoraX is built with security as the foundation, not an afterthought. 
            Every layer is designed to prevent tampering and ensure integrity.
          </p>
        </div>
        
        {/* Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {securityFeatures.map((feature) => (
            <div 
              key={feature.title}
              className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-foreground/10 text-primary-foreground mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-primary-foreground/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Bottom Statement */}
        <div className="max-w-2xl mx-auto text-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary-foreground/10 border border-primary-foreground/20">
            <Shield className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium">
              "Security, correctness, and backend authority come first."
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
