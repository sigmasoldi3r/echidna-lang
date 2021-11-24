const Printer = require("./Printer");
const { CodeSyntaxError, CodeError, CompilerError } = require("./exceptions");

const EXPORT_VAR = `__exported__`;

const ContextType = {
  CLOSURE: Symbol("Closure"),
  TOP_LEVEL: Symbol("Top Level"),
  CLASS: Symbol("Class"),
};

/**
 * Compiler context.
 */
class Context {
  locals = new Map();
  exported = new Set();
  _ = new Printer();
  exportVar = EXPORT_VAR;
  constructor(out, type = ContextType.TOP_LEVEL, parent = null, offset = 0) {
    this.out = out;
    this.type = type;
    this.parent = parent;
    this._.level = (parent?._?.level ?? 0) + offset;
  }

  writeln(what, padding = 0) {
    this._.level += padding;
    this.out.write(this._.toString());
    this._.level -= padding;
    this.out.write(what);
  }
  write(what) {
    this.out.write(what);
  }

  #compileDefArgs(ctx, node, i = 0) {
    const args = node.args[i];
    ctx.write(`(`);
    if (args.length > 0) {
      ctx.compile(args[0], true);
    }
    for (const arg of args.slice(1)) {
      ctx.write(`, `);
      ctx.compile(arg, true);
    }
    ctx.write(`)\n`);
    if (i >= node.args.length - 1) {
      if (node.body.tag === "script") {
        ctx.compile(node.body);
      } else {
        ctx.writeln(`return `);
        ctx.compile(node.body);
        ctx.write(`;\n`);
      }
    } else {
      ctx.writeln(`return function`, i);
      ctx.#compileDefArgs(ctx.push(ContextType.CLOSURE, 1), node, i + 1);
      ctx.writeln(`end\n`, i);
    }
  }

  // Compiler functions //
  script = ({ statements }) => {
    for (const statement of statements) {
      this.compile(statement, true);
    }
  };
  let = (node) => {
    if (node.name.tag !== "name" && node.init == null) {
      throw new CodeSyntaxError(
        `Cannot destructure values from non-assigning declaration!`,
        node.name
      );
    }
    if (node.name.tag === "name") {
      const name = this.compile(node.name);
      this.locals.set(name, {
        kind: "let",
        mutable: node.mut,
        name,
        location: node.location,
      });
      this.writeln(`local ${name}`);
      if (node.init != null) {
        this.write(` = `);
        this.compile(node.init, true);
      }
      this.write(`;\n`);
    } else if (node.name.tag === "objectDestructure") {
      this.writeln(`local `);
      const nameList = [];
      for (const n of node.name.names) {
        const name = this.compile(n);
        this.locals.set(name, {
          kind: "let",
          mutable: node.mut,
          name,
          location: n.location,
        });
        nameList.push(name);
      }
      this.write(nameList.join(", "));
      this.write(";\n");
      this.writeln(`do\n`);
      const local = this.push(ContextType.CLOSURE, 1);
      local.writeln(`local __target__ = `);
      local.compile(node.init, true);
      local.write(`;\n`);
      for (const name of nameList) {
        local.writeln(`${name} = __target__.${name};\n`);
      }
      this.writeln(`end\n`);
    } else if (node.name.tag === "arrayDestructure") {
    }
  };
  def = (node) => {
    const name = this.compile(node.name);
    const context = this.push(ContextType.CLOSURE, 1);
    this.locals.set(name, {
      kind: "def",
      name,
      extension: node.extension,
      operator: node.operator,
      location: node.location,
      context,
    });
    if (node.extension != null) {
      this.writeln(`function `);
      this.compile(node.extension, true);
      this.write(`:${name}`);
    } else {
      this.writeln(`local function ${name}`);
    }
    this.#compileDefArgs(context, node);
    this.writeln(`end\n`);
  };
  #compileClassDef(field, name) {
    this.writeln(`function class`, 1);
    if (field.static) {
      this.write(`.`);
    } else {
      this.write(`:`);
    }
    this.write(name);
    const context = this.push(ContextType.CLOSURE, 2);
    this.#compileDefArgs(context, field);
    this.writeln(`end\n`, 1);
  }
  spreadExpression = () => `...`;
  array = (node) => {
    this.write(`{ `);
    for (const elem of node.elements) {
      this.compile(elem, true);
      this.write(", ");
    }
    this.write(`}`);
  };
  class = (node) => {
    const name = this.compile(node.name);
    this.writeln(`(function()\n`);
    if (node.parent != null) {
      this.writeln(`local class = setmetatable({}, { __index = `, 1);
      this.compile(node.parent, true);
      this.write(` });\n`);
    } else {
      this.writeln(`local class = {};\n`, 1);
    }
    this.writeln(`class.__name = "${name}";\n`, 1);
    this.writeln(`class.__index = class;\n`, 1);
    this.writeln(`function class.__new(`, 1);
    for (const param of node.primary ?? []) {
      this.write(this.compile(param.name));
      this.write(`, `);
    }
    this.write(`_`);
    this.write(`)\n`);
    this.writeln(`local new = setmetatable({}, class);\n`, 2);
    for (const param of node.primary ?? []) {
      if (param.field) {
        const name = this.compile(param.name);
        this.writeln(`new.${name} = ${name};\n`, 2);
        if (param.init != null) {
          this.writeln(`if ${name} == nil then\n`, 2);
          this.writeln(`new.${name} = `, 3);
          this.compile(param.init, true);
          this.write(`;\n`);
          this.writeln(`end\n`, 2);
        }
      }
    }
    this.writeln(`return new;\n`, 2);
    this.writeln(`end\n`, 1);
    for (const field of node.body ?? []) {
      const name = this.compile(field.name ?? field.statement?.name);
      if (field.tag === "def") {
        this.#compileClassDef(field, name);
      } else if (field.tag === "decoratedStatement") {
        this.#compileClassDef(field.statement, name);
        for (const decorator of field.decorators) {
          this.writeln(``, 1);
          this.compile(decorator.expr, true);
          this.write(`(class, "`);
          this.write(name);
          this.write(`");\n`);
        }
      } else if (field.tag === "let") {
        this.writeln(`class.`, 1);
        this.compile(field.name, true);
        if (field.init != null) {
          this.write(` = `);
          this.compile(field.init, true);
        }
        this.write(`;\n`);
      }
    }
    this.writeln(`return class\n`, 1);
    this.writeln(`end)()`);
  };
  classStatement = (node) => {
    const context = this.push(ContextType.CLASS);
    const name = this.compile(node.def.name);
    this.locals.set(name, {
      kind: "class",
      name,
      location: node.location,
      context,
    });
    this.writeln(`local ${name} = `);
    context.compile(node.def);
    this.writeln(`;\n`);
  };
  binary = (node) => {
    const { left, op, right } = node;
    switch (op) {
      case "==":
      case "~=":
      case ">=":
      case "<=":
      case ">":
      case "<":
      case "+":
      case "-":
      case "*":
      case "/":
      case "..":
      case "and":
      case "or":
        this.compile(left, true);
        this.write(` ${op} `);
        this.compile(right, true);
        break;
      case "->":
        this.write(`rangeOf(`);
        this.compile(left, true);
        this.write(`, `);
        this.compile(right, true);
        this.write(`)`);
        break;
      case "//":
        this.write(`math.floor(`);
        this.compile(left, true);
        this.write(` / `);
        this.compile(right, true);
        this.write(`)`);
        break;
      case "**":
        this.write(`math.pow(`);
        this.compile(left, true);
        this.write(`, `);
        this.compile(right, true);
        this.write(`)`);
        break;
      default:
        throw new CodeError(`Operator ${op} not supported yet`, node);
    }
  };
  #extractPipe(node) {
    if (node.tag !== `pipe`) return [node];
    return [...this.#extractPipe(node.right), node.left];
  }
  #compileLinear([left, ...rest]) {
    this.compile(left, true);
    this.write(`(`);
    if (rest.length === 1) {
      this.compile(rest[0], true);
    } else {
      this.#compileLinear(rest);
    }
    this.write(`)`);
  }
  pipe = (node) => {
    const pipeData = this.#extractPipe(node);
    this.#compileLinear(pipeData);
  };
  #compileAssignPart(local, left, op, right) {
    local.compile(left, true);
    local.write(` = `);
    switch (op) {
      case "+":
      case "-":
      case "*":
      case "/":
      case "..":
      case "and":
      case "or":
        local.compile(left, true);
        local.write(` ${op} `);
        break;
    }
    local.compile(right, true);
  }
  assign = (node) => {
    const { left, op, right } = node;
    this.write(`(function()\n`);
    const local = this.push(ContextType.CLOSURE, 1);
    local.writeln(``);
    this.#compileAssignPart(local, left, op, right);
    local.write(`;\n`);
    local.writeln(`return `);
    local.compile(left, true);
    local.write(`;\n`);
    this.writeln(`end)()`);
  };
  arrayAccess = (node) => {
    this.compile(node.head, true);
    this.write(`[`);
    this.compile(node.term, true);
    this.write(`]`);
  };
  access = (node) => {
    const { left, op, right } = node;
    this.compile(left, true);
    if (
      right.value?.match(
        /^(not|and|or|end|function|while|true|false|do|repeat|until)$/
      )
    ) {
      this.write(`["${right.value.replace(/"/g, '\\"')}"]`);
    } else {
      this.write(op);
      this.compile(right, true);
    }
  };
  unary = (node) => {
    const { op, expr } = node;
    switch (op) {
      case "not":
        this.write(`${op} `);
        this.compile(expr, true);
        break;
      case "~":
      case "-":
        this.write(op);
        this.compile(expr, true);
        break;
      case "new":
        if (expr.tag !== "call") {
          throw new CodeSyntaxError(
            "new expression must be preceding a call signature!",
            node
          );
        }
        this.compile(expr.target, true);
        this.write(".__new(");
        if (expr.args != null) {
          if (expr.args.length > 0) {
            this.compile(expr.args[0], true);
          }
          for (const arg of expr.args.slice(1)) {
            this.write(", ");
            this.compile(arg, true);
          }
        }
        this.write(")");
        break;
    }
  };
  expressionStatement = (node) => {
    if (node.expr.tag === "assign") {
      const { left, op, right } = node.expr;
      this.writeln(``);
      this.#compileAssignPart(this, left, op, right);
      this.write(`;\n`);
      return;
    }
    this.writeln(``);
    this.compile(node.expr, true);
    this.write(`;\n`);
  };
  number = (node) => node.value;
  string = (node) => {
    if (node.segments.length === 1) {
      this.compile(node.segments[0], true);
      return;
    }
    for (const segment of node.segments.slice(0, -1)) {
      if (segment.tag !== "text") {
        this.write(`tostring(`);
      }
      this.compile(segment, true);
      if (segment.tag !== "text") {
        this.write(`)`);
      }
      this.write(` .. `);
    }
    const segment = node.segments[node.segments.length - 1];
    if (segment.tag !== "text") {
      this.write(`tostring(`);
    }
    this.compile(segment, true);
    if (segment.tag !== "text") {
      this.write(`)`);
    }
  };
  lambda = (node) => {
    this.write(`function(`);
    if (node.args instanceof Array) {
      if (node.args.length > 0) {
        this.compile(node.args[0], true);
      }
      for (const arg of node.args.slice(1)) {
        this.write(`, `);
        this.compile(arg, true);
      }
    } else if (node.args != null) {
      this.compile(node.args, true);
    } else {
      this.write(`it`);
    }
    this.write(`)\n`);
    const context = this.push(ContextType.CLOSURE, 1);
    if (node.body.tag !== "script") {
      context.writeln(`return `);
      context.compile(node.body);
      context.write(`;\n`);
    } else if (
      node.body.statements.length === 1 &&
      node.body.statements[0].tag === "expressionStatement"
    ) {
      context.writeln(`return `);
      context.compile(node.body.statements[0].expr, true);
      context.write(`;\n`);
    } else {
      context.compile(node.body);
    }
    this.writeln(`end`);
  };
  call = (node) => {
    this.compile(node.target, true);
    this.write(`(`);
    if (node.args?.length > 0) {
      this.compile(node.args[0], true);
    }
    for (const arg of (node.args ?? []).slice(1)) {
      this.write(`, `);
      this.compile(arg, true);
    }
    this.write(`)`);
  };
  text = (node) => {
    this.write(`"${node.value.replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`);
  };
  export = ({ statement, defaults }) => {
    this.compile(statement, true);
    const name = this.compile(statement.name ?? statement.def?.name);
    if (defaults != null) {
      this.writeln(`${this.exportVar} = ${name};\n`);
    } else {
      this.writeln(`${this.exportVar}.${name} = ${name};\n`);
    }
  };
  return = (node) => {
    this.writeln(`return `);
    this.compile(node.expr, true);
    this.write(`;\n`);
  };
  whileStatement = (node) => {
    this.writeln(`while `);
    this.compile(node.test, true);
    this.write(` do\n`);
    const body = this.push(ContextType.CLOSURE, 1);
    body.compile(node.body, true);
    this.writeln(`end\n`);
  };
  name = (node) => node.value;
  keyEscape = (node) => {
    this.write(`[`);
    this.compile(node.expr, true);
    this.write(`]`);
  };
  object = (node) => {
    this.write(`{ `);
    for (const { k, v } of node.pairs) {
      if (k.tag === "string") {
        this.write(`[`);
        this.compile(k, true);
        this.write(`]`);
      } else {
        this.compile(k, true);
      }
      this.write(` = `);
      this.compile(v, true);
      this.write(`, `);
    }
    this.write(`}`);
  };
  decoratedStatement = (node) => {
    const name = node.statement.name ?? node.statement.statement?.def?.name;
    if (name == null) {
      throw new CodeSyntaxError(
        `Not a valid decorator target!`,
        node.statement
      );
    }
    this.compile(node.statement, true);
    for (const decorator of node.decorators) {
      this.writeln(``);
      this.compile(decorator.expr, true);
      this.write(`(`);
      this.compile(name, true);
      this.write(`)\n`);
    }
  };
  ifStatement = (node) => {
    this.writeln(`if `);
    this.compile(node.test, true);
    this.write(` then\n`);
    const body = this.push(ContextType.CLOSURE, 1);
    body.compile(node.body, true);
    if (node.elseIf != null) {
      for (const { test, body } of node.elseIf) {
        const elseCtx = this.push(ContextType.CLOSURE, 1);
        this.writeln(`elseif `);
        this.compile(test, true);
        this.write(` then\n`);
        elseCtx.compile(body, true);
      }
    }
    if (node.elseBody != null) {
      this.writeln(`else\n`);
      const elseCtx = this.push(ContextType.CLOSURE, 1);
      elseCtx.compile(node.elseBody, true);
    }
    this.writeln(`end\n`);
  };
  tryStatement = (node) => {
    this.writeln(`do\n`);
    const ctx = this.push(ContextType.CLOSURE, 1);
    let err = `__err__`;
    if (node.catchBody != null) {
      err = ctx.compile(node.catchBody.target);
    }
    const tryCtx = ctx.push(ContextType.CLOSURE, 1);
    if (node.body.tag === "script") {
      ctx.writeln(`local __result__, ${err} = pcall(function()\n`);
      tryCtx.compile(node.body, true);
      ctx.writeln(`end)\n`);
    } else {
      ctx.writeln(`local __result__, ${err} = pcall(`);
      tryCtx.compile(node.body, true);
      ctx.write(`)\n`);
    }
    if (node.catchBody != null) {
      ctx.writeln(`if ${err} ~= nil then\n`);
      const catchCtx = ctx.push(ContextType.CLOSURE, 1);
      catchCtx.compile(node.catchBody.body, true);
      ctx.writeln(`end\n`);
    }
    if (node.finallyBody != null) {
      ctx.writeln(`do\n`);
      const finallyCtx = ctx.push(ContextType.CLOSURE, 1);
      finallyCtx.compile(node.finallyBody, true);
      ctx.writeln(`end\n`);
    }
    this.writeln(`end\n`);
  };
  notImplementedExpression = (node) => {
    this.write(`error('Not implemented')`);
  };
  throw = (node) => {
    this.write(`error(`);
    this.compile(node.expr, true);
    this.write(`)`);
  };
  forEachStatement = (node) => {
    this.writeln(
      `for ${node.targets.map((n) => this.compile(n)).join(", ")} in `
    );
    this.compile(node.expr, true);
    this.write(` do\n`);
    const local = this.push(ContextType.CLOSURE, 1);
    local.compile(node.body, true);
    this.writeln(`end\n`);
  };
  forStatement = (node) => {
    this.writeln(`do\n`);
    const ctx = this.push(ContextType.CLOSURE, 1);
    if (node.init != null) {
      ctx.compile(node.init, true);
    }
    ctx.writeln(`while `);
    if (node.test != null) {
      ctx.compile(node.test, true);
    }
    ctx.write(` do\n`);
    const inner = ctx.push(ContextType.CLOSURE, 1);
    inner.compile(node.body);
    if (node.increment != null) {
      inner.compile(
        {
          tag: "expressionStatement",
          location: node.increment.location,
          expr: node.increment,
        },
        true
      );
    }
    ctx.writeln(`end\n`);
    this.writeln(`end\n`);
  };
  expressionBraces = (node) => {
    this.write("(");
    this.compile(node.expr, true);
    this.write(")");
  };
  compile = (node, force = false) => {
    try {
      const r = this[node?.tag]?.(node);
      if (force && r != null) {
        this.write(r);
      }
      return r;
    } catch (err) {
      if (err instanceof CompilerError) {
        throw err;
      } else {
        throw new CodeError(`Internal error: ${err.message}`, node);
      }
    }
  };

  /**
   * Pushes one context.
   */
  push(type, offset) {
    return new Context(this.out, type, this, offset);
  }
}

module.exports = {
  Context,
  ContextType,
  EXPORT_VAR,
};
