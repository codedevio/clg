import { Book, FileText, Code, Lightbulb, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StaticPageLayout from "@/components/layout/StaticPageLayout";

const Documentation = () => {
  const sections = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of creating and managing quizzes and surveys.",
      items: [
        "Creating your first quiz",
        "Adding questions and answers",
        "Setting time limits and access controls",
        "Publishing and sharing quizzes",
      ],
    },
    {
      icon: FileText,
      title: "Quiz Management",
      description: "Advanced features for quiz creation and administration.",
      items: [
        "Bulk question upload via CSV",
        "Question difficulty levels",
        "Negative marking configuration",
        "Batch-based access control",
      ],
    },
    {
      icon: Code,
      title: "Survey Builder",
      description: "Create comprehensive surveys with various question types.",
      items: [
        "Multiple question formats",
        "Required vs optional questions",
        "Response collection and analysis",
        "Export survey results",
      ],
    },
    {
      icon: Lightbulb,
      title: "Analytics & Reports",
      description: "Understand performance with detailed analytics.",
      items: [
        "Student performance tracking",
        "Quiz attempt analytics",
        "Score distributions",
        "Export data for external analysis",
      ],
    },
  ];

  return (
    <StaticPageLayout
      title="Documentation"
      subtitle="Everything you need to know about using our platform effectively."
    >
      <SEO title="Documentation | Quizorax" description="Learn how to use Quizorax to create quizzes and surveys." />
      <div className="space-y-8">
        {/* Quick Links */}
        <Card className="bg-gradient-card border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-xl">Quick Start Guide</CardTitle>
            <CardDescription>
              New to the platform? Start here to get up and running in minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="group">
              Start Tutorial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Documentation Sections */}
        <div className="grid gap-6 sm:grid-cols-2">
          {sections.map((section, index) => (
            <Card
              key={section.title}
              className="bg-card border shadow-sm hover:shadow-elegant transition-shadow duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Need More Help */}
        <Card className="bg-muted/30 border">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for?
            </p>
            <Button variant="outline" asChild>
              <Link to="/help">Visit Help Center</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </StaticPageLayout>
  );
};

export default Documentation;
