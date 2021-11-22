class CompilerError extends Error {}

class InternalError extends CompilerError {}

class CodeError extends CompilerError {
  /**
   * @param {*} message
   * @param {{location:*}} origin
   */
  constructor(message, origin) {
    super(message);
    this.origin = origin;
    if (origin instanceof CompilerError) {
      this.location = origin.origin.location;
    } else {
      this.location = origin.location;
    }
  }
}

class CodeSyntaxError extends CodeError {
  /**
   * @param {string} message
   * @param {Error|{location:*}} origin
   */
  constructor(message, origin) {
    super(message, origin);
  }
}

function die(throwable) {
  throw throwable;
}

module.exports = {
  CodeSyntaxError,
  CodeError,
  InternalError,
  CompilerError,
  die,
};
