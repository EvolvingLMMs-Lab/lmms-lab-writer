"use client";

import Link from "next/link";
import {
  Download as DownloadIcon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  Bot as BotIcon,
  FileText as FileTextIcon,
  Terminal as TerminalIcon,
  GitBranch as GitBranchIcon,
  type LucideIcon,
} from "lucide-react";
import {
  FadeIn,
  FadeInStagger,
  FadeInStaggerItem,
  MotionCard,
} from "@/components/motion";
import { DEFAULT_LOCALE, withLocalePrefix, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";

function getDocIcon(href: string): LucideIcon {
  switch (href) {
    case "/docs/installation":
      return DownloadIcon;
    case "/docs/quick-start":
      return ZapIcon;
    case "/docs/opencode":
      return SparklesIcon;
    case "/docs/ai-agents":
      return BotIcon;
    case "/docs/compilation":
      return FileTextIcon;
    case "/docs/terminal":
      return TerminalIcon;
    case "/docs/git":
      return GitBranchIcon;
    default:
      return FileTextIcon;
  }
}

export function DocsContent({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale);

  return (
    <main className="flex-1 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <h1 className="text-2xl font-medium tracking-tight mb-2">
            {messages.docs.title}
          </h1>
          <p className="text-sm text-muted mb-12">
            {messages.docs.subtitle}
          </p>
        </FadeIn>

        <div className="space-y-10">
          {messages.docs.sections.map((section) => (
            <div key={section.title}>
              <FadeIn>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted mb-4">
                  {section.title}
                </h2>
              </FadeIn>
              <FadeInStagger
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                staggerDelay={0.06}
              >
                {section.items.map((item) => {
                  const Icon = getDocIcon(item.href);

                  return (
                    <FadeInStaggerItem key={item.href}>
                      <Link
                        href={withLocalePrefix(item.href, locale)}
                        className="block h-full"
                      >
                        <MotionCard className="border border-border p-5 h-full">
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-8 h-8 border border-foreground flex items-center justify-center bg-neutral-50 shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-medium">{item.title}</h3>
                          </div>
                          <p className="text-sm text-muted leading-relaxed">
                            {item.description}
                          </p>
                        </MotionCard>
                      </Link>
                    </FadeInStaggerItem>
                  );
                })}
              </FadeInStagger>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
