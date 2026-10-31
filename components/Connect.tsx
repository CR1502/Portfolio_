import ContactForm from "./ContactForm";
export default function Connect() {
  return (
    <section
      id="connect"
      className="section connect-section panel"
      aria-labelledby="connect-title"
    >
      <p className="eyebrow">Make a connection</p>
      <h2 id="connect-title">
        Say <em>hello.</em>
      </h2>
      <p className="connect-intro">
        For AI engineering roles, project questions, or a conversation about
        building something together.
      </p>
      <ContactForm enabled={Boolean(process.env.CONTACT_FORM_ENDPOINT)} />
      <div className="contact-socials">
        <a
          href="https://linkedin.com/in/croberts02"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn ↗
        </a>
        <a href="https://github.com/CR1502" target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </div>
    </section>
  );
}
