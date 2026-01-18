import Hero from '@/components/Hero';
import SearchBar from '@/components/SearchBar';
import Vision from '@/components/Vision';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import SupportedBy from '@/components/SupportedBy';

export default function Home() {
  return (
    <main className="pt-[64px]">
      <Hero />
      {/* <SearchBar /> */}
      <SupportedBy />
      <Vision />
      <Features />
      <HowItWorks />
    </main>
  );
}