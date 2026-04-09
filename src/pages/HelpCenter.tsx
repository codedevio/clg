import { Search, MessageCircle, HelpCircle, BookOpen, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import StaticPageLayout from "@/components/layout/StaticPageLayout";

const HelpCenter = () => {
  const categories = [
    { icon: BookOpen, title: "Getting Started", count: 12 },
    { icon: HelpCircle, title: "Account & Billing", count: 8 },
    { icon: Users, title: "User Management", count: 6 },
    { icon: Settings, title: "Settings & Configuration", count: 10 },
  ];

  const faqs = [
    {
      question: "How do I create my first quiz?",
      answer:
        "Navigate to the Dashboard, click on 'Quizzes' in the sidebar, then click 'Create New Quiz'. Fill in the quiz details, add your questions, and publish when ready.",
    },
    {
      question: "Can students see their results immediately?",
      answer:
        "Yes, you can configure this in the quiz settings. Enable 'Show Results to Students' to allow immediate result viewing after submission.",
    },
    {
      question: "How do I upload questions in bulk?",
      answer:
        "Use the CSV upload feature in the quiz builder. Download our template, fill in your questions, and upload the file. The system will automatically parse and add all questions.",
    },
    {
      question: "What is batch-based access control?",
      answer:
        "Batch-based access allows you to restrict quiz access to specific student batches. Only students belonging to the allowed batches can attempt the quiz.",
    },
    {
      question: "How does negative marking work?",
      answer:
        "When enabled, incorrect answers deduct marks from the total score. You can configure the deduction amount per wrong answer in the quiz settings.",
    },
    {
      question: "Can I edit a quiz after publishing?",
      answer:
        "Yes, you can edit quiz settings and questions even after publishing. If students have already attempted the quiz, their results will be automatically recalculated based on the updated questions.",
    },
  ];

  return (
    <StaticPageLayout
      title="Help Center"
      subtitle="Find answers to common questions and get the support you need."
    >
      <SEO title="Help Center | Quizorax" description="Find answers to common questions and get support for Quizorax." />
      <div className="space-y-8">
        {/* Search Bar */}
        <Card className="bg-gradient-card border shadow-elegant">
          <CardContent className="py-8">
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for help articles..."
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Card
              key={category.title}
              className="bg-card border shadow-sm hover:shadow-elegant hover:border-primary/20 transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{category.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.count} articles
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <Card className="bg-card border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to the most common questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Still need help?</h3>
                  <p className="text-primary-foreground/80">
                    Our support team is here to assist you.
                  </p>
                </div>
              </div>
              <Button variant="secondary" asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaticPageLayout>
  );
};

export default HelpCenter;
