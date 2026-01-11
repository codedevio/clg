import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface StaticPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const StaticPageLayout = ({ children, title, subtitle }: StaticPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-primary-foreground py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center animate-fade-up">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                {title}
              </h1>
              {subtitle && (
                <p className="text-lg sm:text-xl text-primary-foreground/80 animate-fade-up-delay-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto animate-fade-up-delay-2">
              {children}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StaticPageLayout;
