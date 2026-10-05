/** Pure calculator logic. No eval: a small recursive-descent parser handles + - × ÷ % ( ) and decimals. */

/** @typedef {"num" | "op" | "equals"} KeyKind */

/** Key layout, row by row, four columns. @type {{ label: string, kind: KeyKind }[]} */
export const CALC_KEYS = [
  ..."C()÷789×456-123+0.=%".split("").map((label) => ({
    label,
    kind: /** @type {KeyKind} */ (label === "=" ? "equals" : /[0-9.]/.test(label) ? "num" : "op"),
  })),
];

const ERROR = "Error";

/**
 * @param {string} src expression with × and ÷ already replaced by * and /, whitespace removed
 * @returns {number}
 */
function parse(src) {
  let i = 0;
  const fail = () => {
    throw new SyntaxError("bad expression");
  };
  const factor = () => {
    if (src[i] === "-") {
      i += 1;
      return -factor();
    }
    let value;
    if (src[i] === "(") {
      i += 1;
      value = sum();
      if (src[i] !== ")") fail();
      i += 1;
    } else {
      const match = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i));
      if (!match) fail();
      value = Number(match[0]);
      i += match[0].length;
    }
    while (src[i] === "%") {
      value /= 100;
      i += 1;
    }
    return value;
  };
  const product = () => {
    let value = factor();
    while (src[i] === "*" || src[i] === "/") {
      const op = src[i];
      i += 1;
      const right = factor();
      value = op === "*" ? value * right : value / right;
    }
    return value;
  };
  const sum = () => {
    let value = product();
    while (src[i] === "+" || src[i] === "-") {
      const op = src[i];
      i += 1;
      const right = product();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  };
  const result = sum();
  if (i !== src.length) fail();
  return result;
}

/**
 * @param {string} expr
 * @returns {string | null} the result rounded to 8 decimals, or null when the expression is invalid
 */
export function evaluate(expr) {
  try {
    const result = parse(expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, ""));
    return Number.isFinite(result) ? String(Number(result.toFixed(8))) : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} expr current display
 * @param {string} key a label from CALC_KEYS, or "⌫"
 * @returns {string} next display
 */
export function pressKey(expr, key) {
  if (key === "C") return "0";
  if (key === "⌫") return expr === ERROR || expr.length <= 1 ? "0" : expr.slice(0, -1);
  if (key === "=") return evaluate(expr) ?? ERROR;
  const fresh = expr === "0" || expr === ERROR;
  if (!fresh) return expr + key;
  return (/[0-9.(]/.test(key) ? "" : "0") + key;
}

/** @type {Record<string, string>} */
const KEYBOARD = { Enter: "=", "=": "=", "*": "×", "/": "÷", Backspace: "⌫", Delete: "C" };

/**
 * @param {string} eventKey KeyboardEvent.key
 * @returns {string | null} calculator key, or null when the key is not one
 */
export function keyFromEvent(eventKey) {
  if (KEYBOARD[eventKey]) return KEYBOARD[eventKey];
  return /^[0-9.()+\-%]$/.test(eventKey) ? eventKey : null;
}
