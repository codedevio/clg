import { Button } from "@/components/ui/button";
import { Users, GraduationCap, UserCog, ArrowRight } from "lucide-react";

const roles = [
  {
    icon: UserCog,
    title: "Admin",
    description: "System-wide oversight and control",
    capabilities: [
      "Manage all creators and students",
      "View system-wide analytics",
      "Moderate quizzes and surveys",
      "Block or delete misuse",
      "System configuration",
    ],
    cta: "Admin Login",
    variant: "hero" as const,
  },
  {
    icon: GraduationCap,
    title: "Teacher / Creator",
    description: "Create and manage assessments",
    capabilities: [
      "Create quizzes and surveys",
      "Configure access rules",
      "View student attempts",
      "Analyze performance",
      "Export results",
    ],
    cta: "Creator Dashboard",
    variant: "accent" as const,
  },
  {
    icon: Users,
    title: "Student",
    description: "Take assessments via shared links",
    capabilities: [
      "Access via quiz link",
      "No account required",
      "Submit verified identity",
      "One attempt per quiz",
      "View results (if allowed)",
    ],
    cta: "Enter Quiz Code",
    variant: "subtle" as const,
  },
];

const RolesSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            User Roles
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Clear Roles, Clear Permissions
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            QuizoraX enforces strict role-based access control. 
            Each user type has precisely defined capabilities.
          </p>
        </div>
        
        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {roles.map((role) => (
            <div 
              key={role.title}
              className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-elegant transition-all duration-300 flex flex-col"
            >
              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 text-primary">
                  <role.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {role.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </div>
              
              {/* Capabilities */}
              <ul className="space-y-3 mb-6 flex-1">
                {role.capabilities.map((capability, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                    {capability}
                  </li>
                ))}
              </ul>
              
              {/* CTA */}
              <Button variant={role.variant} className="w-full">
                {role.cta}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RolesSection;
