/**
 * Pure helpers for the terminal's virtual filesystem.
 *
 * Nodes are `{ type: "dir", children }`, `{ type: "file", content }` or
 * `{ type: "tool", slug }`. Child lookups use `Object.hasOwn` so names such as
 * `constructor` never resolve to inherited properties.
 */

/**
 * @typedef {{ type: "file", content: string[] }
 *   | { type: "tool", slug: string }
 *   | { type: "dir", children: Record<string, FsNode> }} FsNode
 */

/**
 * Returns a copy of `root` whose `tools/` directory holds one `tool` node per slug.
 * @param {FsNode} root
 * @param {readonly { slug: string }[]} toolList
 * @returns {FsNode}
 */
export function buildFilesystem(root, toolList) {
  if (root.type !== "dir") return root;
  /** @type {Record<string, FsNode>} */
  const children = {};
  for (const [name, child] of Object.entries(root.children)) {
    if (name === "tools" && child.type === "dir") {
      /** @type {Record<string, FsNode>} */
      const toolNodes = {};
      for (const { slug } of toolList) toolNodes[slug] = { type: "tool", slug };
      children[name] = { type: "dir", children: toolNodes };
    } else {
      children[name] = buildFilesystem(child, toolList);
    }
  }
  return { type: "dir", children };
}

/**
 * Resolves `input` against `cwd`. Handles `a/b`, `..`, `.`, trailing and repeated
 * slashes, and a leading `/` or `~` (both mean the root).
 * @param {FsNode} root
 * @param {string[]} cwd path segments of the current directory
 * @param {string} input
 * @returns {{ segments: string[], node: FsNode } | null} null when any segment is missing or a file is traversed
 */
export function resolvePath(root, cwd, input) {
  const parts = input.split("/");
  const absolute = input.startsWith("/") || parts[0] === "~";
  /** @type {string[]} */
  const segments = absolute ? [] : [...cwd];
  for (const part of parts) {
    if (part === "" || part === "." || part === "~") continue;
    if (part === "..") {
      segments.pop();
      continue;
    }
    segments.push(part);
  }

  /** @type {FsNode} */
  let node = root;
  for (const segment of segments) {
    if (node.type !== "dir" || !Object.hasOwn(node.children, segment)) return null;
    node = node.children[segment];
  }
  return { segments, node };
}

/**
 * Formats a cwd for the prompt.
 * @param {string[]} segments
 * @returns {string}
 */
export function pathLabel(segments) {
  return segments.length === 0 ? "~" : `~/${segments.join("/")}`;
}

/**
 * Splits `ls`-style arguments into flags and operands.
 * @param {string[]} args
 * @returns {{ showAll: boolean, operands: string[] }}
 */
export function parseLsArgs(args) {
  let showAll = false;
  /** @type {string[]} */
  const operands = [];
  for (const arg of args) {
    if (arg.startsWith("-") && arg.length > 1) {
      if (arg.includes("a")) showAll = true;
    } else {
      operands.push(arg);
    }
  }
  return { showAll, operands };
}

/**
 * Names in a directory, directories suffixed with `/`, dotfiles hidden unless `showAll`.
 * @param {FsNode} dir
 * @param {boolean} showAll
 * @returns {string[]}
 */
export function listEntries(dir, showAll) {
  if (dir.type !== "dir") return [];
  return Object.entries(dir.children)
    .filter(([name]) => showAll || !name.startsWith("."))
    .map(([name, child]) => (child.type === "dir" ? `${name}/` : name));
}
