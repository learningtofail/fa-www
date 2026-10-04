import "../styles/content.css";

export default function AboutContent() {
  return (
    <div className="content">
      <p className="content__prompt">faysal@desktop:~$ whoami</p>{" "}
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
