export default function AboutContent() {
  return (
    <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", lineHeight: "var(--line-height-body)" }}>
      <p
        style={{
          fontFamily: "var(--font-terminal)",
          color: "var(--content-text-muted)",
          margin: "0 0 0.75rem",
        }}
      >
        faysal@desktop:~$ whoami
      </p>
      <p>22 years making Google behave. Currently VP-track: SEO, organic growth, the occasional turnaround.</p>
      <p>
        Real background lives at{" "}
        <a href="https://portfolio.faysalahmed.ca" target="_blank" rel="noreferrer">
          portfolio.faysalahmed.ca
        </a>{" "}
        — this is the version of the site that doesn&apos;t take itself as seriously.
      </p>
      <p>There&apos;s a terminal around here somewhere. Try it.</p>
    </div>
  );
}
