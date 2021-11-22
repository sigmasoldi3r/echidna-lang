const { Context } = require("./Context");
const { CodeSyntaxError: SyntaxError } = require("./exceptions");
const grammar = require("./grammar");

module.exports = class Compiler {
  constructor(out) {
    this.root = new Context(out);
  }
  compile(src, grammarSource) {
    let ast;
    try {
      ast = grammar.parse(src, { grammarSource });
    } catch (err) {
      throw new SyntaxError("Unexpected token", err);
    }
    this.root.writeln(`-- EXPORTED\nlocal ${this.root.exportVar} = {};\n`);
    this.root.compile(ast);
    this.root.writeln(`return ${this.root.exportVar};\n`);
  }
};
