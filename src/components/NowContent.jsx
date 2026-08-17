export default function NowContent({ lastDeploy }) {
  return (
    <div style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: "0.85rem", lineHeight: 1.6 }}>
      <p style={{ color: "#6b6b6b", margin: "0 0 0.75rem" }}>faysal@desktop:~$ cat status.txt</p>
      <p>status: looking for the next thing to fix</p>
      <p>uptime: since 2004</p>
      <p>last deploy: {lastDeploy}</p>
    </div>
  );
}
