import "../styles/content.css";
import { CAREER_START_YEAR, PROFILE } from "../data/profile.js";

export default function NowContent({ lastDeploy }) {
  return (
    <div className="content content--mono">
      <p className="content__prompt">faysal@desktop:~$ cat status.txt</p>
      <p>status: {PROFILE.status}</p>
      <p>uptime: since {CAREER_START_YEAR}</p>
      <p>last deploy: {lastDeploy}</p>
    </div>
  );
}
