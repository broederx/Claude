import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ContentTypes from "@/components/ContentTypes";
import WhyNow from "@/components/WhyNow";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <ContentTypes />
        <WhyNow />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
