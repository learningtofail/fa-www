export default function NowContent({ lastDeploy }) {
  return (
    <div style={{ fontFamily: "var(--font-terminal)", fontSize: "0.85rem", lineHeight: "var(--line-height-terminal)" }}>
      <p style={{ color: "var(--content-text-muted)", margin: "0 0 0.75rem" }}>faysal@desktop:~$ cat status.txt</p>
      <p>status: looking for the next thing to fix</p>
      <p>uptime: since 2004</p>
      <p>last deploy: {lastDeploy}</p>
    </div>
  );
}
