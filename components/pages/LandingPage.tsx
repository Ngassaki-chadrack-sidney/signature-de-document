"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileSignature, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const t = useTranslations();
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.from(titleRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
      });

      gsap.from(subtitleRef.current, {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "power4.out",
      });

      gsap.from(ctaRef.current, {
        y: 20,
        opacity: 0,
        duration: 1,
        delay: 0.4,
        ease: "power4.out",
      });

      // Features Animation
      const features = featuresRef.current?.children;
      if (features) {
        gsap.from(Array.from(features), {
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-20 text-center"
        >
          <div className="max-w-4xl">
            <h1
              ref={titleRef}
              className="mb-6 text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl"
            >
              {t("landing.hero.title")}
            </h1>
            <p
              ref={subtitleRef}
              className="mx-auto mb-10 max-w-2xl text-lg font-medium text-muted-foreground sm:text-xl"
            >
              {t("landing.hero.subtitle")}
            </p>
            <div ref={ctaRef} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-14 px-8 text-lg font-bold border-2 shadow-none">
                <Link href="/sign">
                  {t("app.cta")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg font-bold border-2 shadow-none"
              >
                {t("app.learn_more")}
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/30 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-16 text-center text-3xl font-black tracking-tight sm:text-5xl">
              {t("landing.features.title")}
            </h2>

            <div
              ref={featuresRef}
              className="grid gap-8 md:grid-cols-3"
            >
              <FeatureCard
                icon={FileSignature}
                title={t("landing.features.items.easy.title")}
                description={t("landing.features.items.easy.description")}
              />
              <FeatureCard
                icon={ShieldCheck}
                title={t("landing.features.items.secure.title")}
                description={t("landing.features.items.secure.description")}
              />
              <FeatureCard
                icon={Zap}
                title={t("landing.features.items.fast.title")}
                description={t("landing.features.items.fast.description")}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border-2 border-foreground bg-background p-8 transition-transform hover:-translate-y-1">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-foreground bg-primary text-primary-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
