const fs = require("fs");
const chalk = require("chalk");
const { CodeError } = require("./exceptions");

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
          console.error(
            `
${chalk.blue(source)}:${chalk.yellow(start.line)}:${chalk.yellow(
              start.column
            )} - ${chalk.red(err.name ?? "error")}: ${err.message}

${chalk.black.bgWhite(lineText)} ${line}
${chalk.bgWhite(" ".repeat(lineText.length))} ${" ".repeat(
              Math.max(start.column - 1, 0)
            )}${chalk.red("^".repeat(Math.max(end.column - start.column, 0)))}`
          );
          // if ()
          console.error(chalk`\n{red Trace:\n ${err.stack}}`);
          throw err;
        } else {
          console.error(chalk`{red Unable to map the error}`);
          throw err;
        }
      }
    },
  };
};

module.exports = source;
