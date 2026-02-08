import { Shield, Eye, Lock, Bell, Trash2, Globe } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StaticPageLayout from "@/components/layout/StaticPageLayout";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Eye,
      title: "Information We Collect",
      content: `We collect information you provide directly to us, such as when you create an account, participate in quizzes or surveys, or contact us for support.

**Personal Information:**
- Name and email address
- Educational institution details
- Quiz and survey responses
- Account preferences

**Automatically Collected Information:**
- Device and browser information
- IP address and location data
- Usage patterns and analytics`,
    },
    {
      icon: Lock,
      title: "How We Use Your Information",
      content: `We use the information we collect to:

- Provide, maintain, and improve our services
- Process quiz and survey submissions
- Generate analytics and performance reports
- Send you technical notices and support messages
- Respond to your comments and questions
- Detect and prevent fraudulent activity

We do not sell your personal information to third parties.`,
    },
    {
      icon: Shield,
      title: "Data Security",
      content: `We implement appropriate technical and organizational measures to protect your personal information:

- Encryption of data in transit and at rest
- Regular security assessments and audits
- Access controls and authentication mechanisms
- Secure data centers with physical security measures

While we strive to protect your information, no method of transmission over the Internet is 100% secure.`,
    },
    {
      icon: Globe,
      title: "Data Sharing",
      content: `We may share your information in the following circumstances:

- With quiz/survey creators for response analysis
- With service providers who assist our operations
- When required by law or legal process
- To protect our rights and prevent fraud
- With your consent or at your direction

We require all third parties to maintain confidentiality and security of your data.`,
    },
    {
      icon: Bell,
      title: "Your Rights",
      content: `You have the following rights regarding your personal data:

- **Access**: Request a copy of your personal data
- **Correction**: Request correction of inaccurate data
- **Deletion**: Request deletion of your data
- **Portability**: Request transfer of your data
- **Opt-out**: Unsubscribe from marketing communications

To exercise these rights, please contact us at privacy@quizorax.com.`,
    },
    {
      icon: Trash2,
      title: "Data Retention",
      content: `We retain your personal information for as long as necessary to:

- Provide our services to you
- Comply with legal obligations
- Resolve disputes and enforce agreements
- Maintain business records

Quiz and survey responses are retained according to the settings configured by quiz creators. You can request deletion of your account and associated data at any time.`,
    },
  ];

  return (
    <StaticPageLayout
      title="Privacy Policy"
      subtitle="Last updated: January 11, 2026"
    >
      <SEO title="Privacy Policy | Quizorax" description="Read our privacy policy to understand how we collect, use, and protect your data." />
      <div className="space-y-6">
        {/* Introduction */}
        <Card className="bg-gradient-card border shadow-elegant">
          <CardContent className="py-6">
            <p className="text-muted-foreground leading-relaxed">
              At QuizoraX, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully to understand our practices regarding your personal data.
            </p>
          </CardContent>
        </Card>

        {/* Policy Sections */}
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

        {/* Contact */}
        <Card className="bg-muted/30 border">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-2">
              Questions about this Privacy Policy?
            </p>
            <p className="font-medium">
              Contact us at{" "}
              <a
                href="mailto:privacy@quizorax.com"
                className="text-primary hover:underline"
              >
                privacy@quizorax.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </StaticPageLayout>
  );
};

export default PrivacyPolicy;
