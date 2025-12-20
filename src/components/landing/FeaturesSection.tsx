import { 
  Shield, 
  UserCheck, 
  Timer, 
  BarChart3, 
  Lock, 
  FileSpreadsheet,
  CheckCircle2,
  Zap
} from "lucide-react";

const features = [
  {
    icon: UserCheck,
    title: "Mandatory Identity Capture",
    description: "Every student must verify their identity before starting. College ID, Roll Number, and Batch are permanently linked to each attempt.",
    highlight: "No anonymous attempts",
  },
  {
    icon: Shield,
    title: "Backend-First Security",
    description: "All validation happens at the server level. Access rules, timing, and scoring are enforced where they cannot be bypassed.",
    highlight: "Frontend cannot cheat",
  },
  {
    icon: Timer,
    title: "Strict Time Control",
    description: "Configurable time limits with automatic submission. The clock runs server-side, immune to client manipulation.",
    highlight: "Auto-submit on timeout",
  },
  {
    icon: Lock,
    title: "Access Control Modes",
    description: "Public links, password protection, or batch restrictions. Mix and match to control exactly who can access each quiz.",
    highlight: "Flexible yet secure",
  },
  {
    icon: Zap,
    title: "Instant Auto-Evaluation",
    description: "Results calculated the moment a quiz is submitted. Correct answers stored securely, never exposed to clients.",
    highlight: "Immediate scoring",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Question-wise accuracy, difficulty analysis, and performance trends. Export to CSV or Excel with one click.",
    highlight: "Actionable insights",
  },
  {
    icon: FileSpreadsheet,
    title: "Survey Support",
    description: "Create surveys with multiple question types. Collect responses securely with the same backend integrity.",
    highlight: "Beyond quizzes",
  },
  {
    icon: CheckCircle2,
    title: "Anti-Cheat Measures",
    description: "Tab switch tracking, session logging, and rate limiting. Every attempt is auditable and traceable.",
    highlight: "Built-in protection",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Built for Academic Integrity
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Every feature is designed with security as the foundation. 
            No shortcuts, no workarounds — just reliable, exam-grade assessments.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group relative bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-elegant hover:border-border transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 text-primary mb-4 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                <feature.icon className="w-6 h-6" />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {feature.description}
              </p>
              
              {/* Highlight Tag */}
              <span className="inline-block text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded">
                {feature.highlight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
