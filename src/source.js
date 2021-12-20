const fs = require("fs");
const chalk = require("chalk");
const { CodeError } = require("./exceptions");
const logger = require("./services/Logger").instance;

/** @param {string} src */
const source = (source) => {
  const src = fs.readFileSync(source).toString();
  return {
    run(what) {
      try {
        return what(src, source);
      } catch (err) {
        if (err instanceof CodeError && err.location != null) {
          const { start, end } = err.location;
          const line = src.split("\n")[start.line - 1];
          const lineText = start.line + " ";
          logger.log`
${chalk.blue(source)}:${chalk.yellow(start.line)}:${chalk.yellow(
            start.column
          )} - ${chalk.red(err.name ?? "error")}: ${err.message}

${chalk.black.bgWhite(lineText)} ${line}
${chalk.bgWhite(" ".repeat(lineText.length))} ${" ".repeat(
            Math.max(start.column - 1, 0)
          )}${chalk.red("^".repeat(Math.max(end.column - start.column, 0)))}`;
          logger.debug`{red Trace:\n ${err.stack}}`;
          throw err;
        } else {
          logger.error`Unable to map the error\n${err.stack}`;
          throw err;
        }
      }
    },
  };
};

module.exports = source;
