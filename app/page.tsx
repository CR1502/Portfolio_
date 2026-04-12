import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Ticker from '@/components/Ticker';
import Experience from '@/components/Experience';
import Education from '@/components/Education';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Connect from '@/components/Connect';
import Footer from '@/components/Footer';
import DataStream from '@/components/DataStream';
import EasterEggs from '@/components/EasterEggs';
import ClientCanvases from '@/components/ClientCanvases';

export default function Home() {
  return (
    <>
      <ClientCanvases />
      <DataStream />
      <EasterEggs />
      <Nav />
      <Hero />
      <Ticker />
      <Experience />
      <div className="divider" />
      <Education />
      <div className="divider" />
      <Projects />
      <div className="divider" />
      <Skills />
      <div className="divider" />
      <Connect />
      <Footer />
    </>
  );
}
