import { Capabilities } from '../components/landing/Capabilities';
import { Enterprise } from '../components/landing/Enterprise';
import { FinalCta } from '../components/landing/FinalCta';
import { Footer } from '../components/landing/Footer';
import { Hero } from '../components/landing/Hero';
import { Navbar } from '../components/landing/Navbar';
import { ProblemSolution } from '../components/landing/ProblemSolution';
import { Workflow } from '../components/landing/Workflow';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <Workflow />
        <Capabilities />
        <Enterprise />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
