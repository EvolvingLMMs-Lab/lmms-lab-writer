import { Header } from "@/components/header";
import {
  HeroSection,
  DemoSection,
  ComparisonSection,
  FooterLink,
} from "@/components/home-sections";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroSection />
        <DemoSection />
        <ComparisonSection />
      </main>

      <footer className="border-t border-border px-6">
        <div className="max-w-5xl mx-auto py-6 text-sm text-muted text-center">
          Built by <FooterLink />
        </div>
      </footer>
    </div>
  );
}
