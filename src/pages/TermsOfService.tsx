import { FileText, Users, AlertTriangle, Scale, Ban, RefreshCw } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StaticPageLayout from "@/components/layout/StaticPageLayout";

const TermsOfService = () => {
  const sections = [
    {
      icon: FileText,
      title: "1. Acceptance of Terms",
      content: `By accessing and using QuizoraX ("the Platform"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

These terms apply to all users of the Platform, including:
- Quiz and survey creators (educators, administrators)
- Quiz and survey participants (students, respondents)
- Platform administrators`,
    },
    {
      icon: Users,
      title: "2. User Accounts",
      content: `**Account Registration:**
- You must provide accurate and complete information when creating an account
- You are responsible for maintaining the security of your account credentials
- You must notify us immediately of any unauthorized access

**Account Responsibilities:**
- You are responsible for all activities under your account
- You must not share your account with others
- You must be at least 13 years old to create an account

**Account Termination:**
We reserve the right to suspend or terminate accounts that violate these terms.`,
    },
    {
      icon: Scale,
      title: "3. Acceptable Use",
      content: `You agree to use the Platform only for lawful purposes. You must not:

- Upload content that is illegal, harmful, or violates others' rights
- Attempt to gain unauthorized access to our systems
- Use the Platform to send spam or unsolicited communications
- Interfere with the proper functioning of the Platform
- Collect personal information from other users without consent
- Use automated means to access the Platform without permission
- Engage in any activity that could damage our reputation`,
    },
    {
      icon: AlertTriangle,
      title: "4. Content Guidelines",
      content: `**Your Content:**
- You retain ownership of content you create on the Platform
- You grant us a license to host, display, and distribute your content
- You are responsible for ensuring your content does not violate any laws

**Prohibited Content:**
- Content that infringes intellectual property rights
- Harmful, threatening, or harassing content
- Content containing malware or harmful code
- Misleading or fraudulent content
- Content that violates academic integrity policies`,
    },
    {
      icon: Ban,
      title: "5. Limitations of Liability",
      content: `**Service Availability:**
We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. We are not liable for:
- Service interruptions or downtime
- Data loss due to technical failures
- Third-party actions beyond our control

**Disclaimer:**
The Platform is provided "as is" without warranties of any kind. We do not guarantee:
- The accuracy of quiz results or analytics
- Fitness for a particular purpose
- Error-free operation

**Limitation:**
Our total liability shall not exceed the amount paid by you in the past 12 months.`,
    },
    {
      icon: RefreshCw,
      title: "6. Changes to Terms",
      content: `We may update these Terms of Service from time to time. When we make changes:

- We will notify you via email or Platform notification
- The updated terms will be posted on this page
- Continued use after changes constitutes acceptance

**Review Responsibility:**
You are responsible for reviewing these terms periodically. If you disagree with any changes, you may discontinue use of the Platform.

**Effective Date:**
Changes become effective immediately upon posting unless otherwise stated.`,
    },
  ];

  return (
    <StaticPageLayout
      title="Terms of Service"
      subtitle="Last updated: January 11, 2026"
    >
      <SEO title="Terms of Service | Quizorax" description="Read our terms of service to understand the rules and regulations for using Quizorax." />
      <div className="space-y-6">
        {/* Introduction */}
        <Card className="bg-gradient-card border shadow-elegant">
          <CardContent className="py-6">
            <p className="text-muted-foreground leading-relaxed">
              Welcome to QuizoraX. These Terms of Service govern your use of our platform and services. By using QuizoraX, you agree to comply with and be bound by these terms. Please read them carefully before using our services.
            </p>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        {sections.map((section, index) => (
          <Card
            key={section.title}
            className="bg-card border shadow-sm"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {section.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-4 last:mb-0 whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Agreement */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-8 text-center">
            <p className="mb-2">
              By using QuizoraX, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <p className="text-primary-foreground/80 text-sm">
              For questions, contact{" "}
              <a
                href="mailto:legal@quizorax.com"
                className="underline hover:text-primary-foreground"
              >
                legal@quizorax.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </StaticPageLayout>
  );
};

export default TermsOfService;
