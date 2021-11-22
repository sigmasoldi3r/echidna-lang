module.exports = class Printer {
  constructor(char = "  ", level = 0) {
    this.char = char;
    this.level = level;
  }
  toString() {
    return this.char.repeat(this.level);
  }
  push() {
    return new Printer(this.char, this.level + 1);
  }
};
