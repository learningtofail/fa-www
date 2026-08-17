export default function AboutContent() {
  return (
    <div style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: "0.85rem", lineHeight: 1.6 }}>
      <p style={{ color: "#6b6b6b", margin: "0 0 0.75rem" }}>faysal@desktop:~$ whoami</p>
      <p>22 years making Google behave. Currently VP-track: SEO, organic growth, the occasional turnaround.</p>
      <p>
        Real background lives at{" "}
        <a href="https://portfolio.faysalahmed.ca" target="_blank" rel="noreferrer">
          portfolio.faysalahmed.ca
        </a>{" "}
        — this is the version of the site that doesn't take itself as seriously.
      </p>
      <p>There's a terminal around here somewhere. Try it.</p>
    </div>
  );
}
