/**
 * Command history with shell-style recall. Up walks back, Down walks forward, and walking
 * past the newest entry returns to an empty line (`null` means "not recalling").
 */
export class CommandHistory {
  /** @type {string[]} */
  #entries = [];
  /** @type {number | null} */
  #cursor = null;

  /**
   * Records a submitted command and stops any recall in progress. Blank input is ignored.
   * @param {string} command
   */
  push(command) {
    this.#cursor = null;
    if (command.trim()) this.#entries.push(command);
  }

  /** @returns {string | null} the previous entry, or null when there is no history */
  previous() {
    if (this.#entries.length === 0) return null;
    this.#cursor = this.#cursor === null ? this.#entries.length - 1 : Math.max(0, this.#cursor - 1);
    return this.#entries[this.#cursor];
  }

  /** @returns {string | null} the next entry, or "" after the newest one, or null when not recalling */
  next() {
    if (this.#cursor === null) return null;
    const index = this.#cursor + 1;
    if (index >= this.#entries.length) {
      this.#cursor = null;
      return "";
    }
    this.#cursor = index;
    return this.#entries[index];
  }
}
