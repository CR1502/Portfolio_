import WebGLLiquid from "@/components/WebGLLiquid";
import MotionEffects from "@/components/MotionEffects";
import Nav from "@/components/Nav";
import About from "@/components/About";
import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Education from "@/components/Education";
import Skills from "@/components/Skills";
import Connect from "@/components/Connect";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <WebGLLiquid speed={1} grain={0.05} renderScale={1} />
      <MotionEffects />
      <Nav />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <main id="main">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Education />
        <Skills />
        <Connect />
      </main>
      <Footer />
    </>
  );
}
