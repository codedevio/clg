import { ArrowDown, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Your Quiz",
    description: "Set up MCQ questions, configure time limits, assign marks, and choose your access control method.",
    details: ["Add questions with 4 options each", "Set difficulty levels", "Enable negative marking if needed"],
  },
  {
    number: "02",
    title: "Share the Link",
    description: "Generate a secure quiz link. Optionally add password protection or restrict to specific batches.",
    details: ["Public, password, or batch-based access", "One unique link per quiz", "Access validated server-side"],
  },
  {
    number: "03",
    title: "Students Verify Identity",
    description: "Before starting, students must submit their Name, College ID, Roll Number, and Batch. No exceptions.",
    details: ["Identity stored permanently", "One attempt per College ID", "Cannot be edited post-submission"],
  },
  {
    number: "04",
    title: "Secure Attempt",
    description: "Quiz runs with server-side timing. Tab switches are tracked. Answers auto-save. Auto-submit on timeout.",
    details: ["Timer runs on server", "Question order randomized", "Anti-cheat measures active"],
  },
  {
    number: "05",
    title: "Instant Results & Analytics",
    description: "The moment a quiz ends, results are calculated. View detailed analytics or export to CSV/Excel.",
    details: ["Automatic scoring", "Question-wise accuracy", "Export with one click"],
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From quiz creation to result analysis — a streamlined process 
            designed for security and simplicity.
          </p>
        </div>
        
        {/* Steps */}
        <div className="max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-20 bottom-0 w-px bg-border" />
              )}
              
              <div className="relative flex gap-6 pb-12">
                {/* Step Number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm z-10">
                  {step.number}
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Details */}
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
