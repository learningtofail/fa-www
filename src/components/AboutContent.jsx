import "../styles/content.css";
import { PORTFOLIO_BLURB, PROFILE, TERMINAL_HINT, summary } from "../data/profile.js";

export default function AboutContent() {
  return (
    <div className="content">
      <p className="content__prompt">faysal@desktop:~$ whoami</p>
      <p>{summary()}</p>
      <p>
        Real background lives at{" "}
        <a href={PROFILE.portfolio.url} target="_blank" rel="noreferrer">
          {PROFILE.portfolio.label}
        </a>{" "}
        &mdash; {PORTFOLIO_BLURB}
      </p>
      <p>{TERMINAL_HINT}</p>
    </div>
  );
}
