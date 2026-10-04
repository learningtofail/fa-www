import "../styles/content.css";

export default function NowContent({ lastDeploy }) {
  return (
    <div className="content content--mono">
      <p className="content__prompt">faysal@desktop:~$ cat status.txt</p>
      <p>status: looking for the next thing to fix</p>
      <p>uptime: since 2004</p>
      <p>last deploy: {lastDeploy}</p>
    </div>
  );
}
