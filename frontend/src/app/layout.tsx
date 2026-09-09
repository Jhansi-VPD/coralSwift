import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ConsultationProvider } from "@/components/ui/ConsultationContext";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { FloatingChatbot } from "@/components/interactive/FloatingChatbot";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "CoralSwift | Enterprise Software Engineering & High-Scale Cloud Systems",
    template: "%s | CoralSwift"
  },
  description: "Enterprise software services consultancy specializing in resilient multi-cloud architectures, applied generative AI pipelines, and high-throughput distributed systems.",
  keywords: ["Enterprise Software", "Cloud Modernization", "Next.js", "Supabase", "FastAPI", "DevSecOps", "Distributed Systems", "AI Engineering"],
  authors: [{ name: "CoralSwift Engineering" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://coralswift.com",
    title: "CoralSwift | Enterprise Software Services",
    description: "Mission-critical software architectures, applied AI, and high-throughput distributed engineering for global enterprises.",
    siteName: "CoralSwift"
  },
  twitter: {
    card: "summary_large_image",
    title: "CoralSwift | Enterprise Software Engineering",
    description: "Mission-critical software architectures, applied AI, and high-throughput distributed engineering.",
    creator: "@coralswift"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark scroll-smooth`}>
      <body className="bg-[#040812] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-dark-950">
        <ConsultationProvider>
          <Navbar />
          <CommandPalette />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <FloatingChatbot />
        </ConsultationProvider>
      </body>
    </html>
  );
}
