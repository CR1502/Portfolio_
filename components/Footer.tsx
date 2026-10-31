export default function Footer() {
  return (
    <footer className="footer">
      <a className="brand" href="#home" aria-label="Back to top">
        cr<span>.</span>
      </a>
      <span>
        Craig Lionel Roberts <span className="footer-divider">/</span> Built
        with intention.
      </span>
      <a href="#home">Back to top ↑</a>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  );
}
