const source = require("./source");
const fs = require("fs");
const Compiler = require("./Compiler");
const { program } = require("commander");
const YAML = require("yaml");
const chalk = require("chalk");
const path = require("path");
const mkdirp = require("mkdirp");
const cliProgress = require("cli-progress");

const CWD = process.cwd();

function readdirSync(from) {
  return fs.readdirSync(path.join(CWD, from));
}

function readFileSync(from) {
  return fs.readFileSync(path.join(CWD, from));
}

function statSync(from) {
  return fs.statSync(path.join(CWD, from));
}

function createWriteStream(out) {
  return fs.createWriteStream(path.join(CWD, out));
}

program
  .version("1.0.0")
  .argument(
    "[input file]",
    "The file to compile, do not use if --config flag is specified."
  )
  .option("-c, --config <file>", "Use configuration file")
  .option("-o, --out <file>", "Specify the output file")
  .parse();

const options = program.opts();

/**
 * @param {string} file
 * @param {string} out
 */
function compile(file, out) {
  const outFile = out ?? file.replace(/\.ech(idna)?/, ".lua");
  source(file ?? "unknown").run((src, source) => {
    const compiler = new Compiler(createWriteStream(outFile));
    return compiler.compile(src, source);
  });
}

const log = {
  config(...args) {
    console.log(chalk`{blue [config]} ` + chalk(...args));
  },
};

const ErrorCodes = {
  WRONG_USAGE: 5,
  CONFIG_NOT_FOUND: 9,
  CONFIG_NO_INPUT_FILES: 10,
};

function tryParseConfig(from) {
  const stats = statSync(from);
  let baseName;
  if (stats.isDirectory()) {
    const dirs = readdirSync(from);
    console.log(chalk`{cyan [debug]}: ${dirs}`);
    const config = dirs.find((s) => s.match(/^echidnaconf\.ya?ml$/));
    if (config == null) {
      log.config`{red ERROR! Could not find a project configuration file at ${from}!}`;
      process.exit(ErrorCodes.CONFIG_NOT_FOUND);
    }
    baseName = from;
    from = path.join(from, config);
  } else {
    baseName = path.basename(from);
  }
  const rawConf = readFileSync(from).toString();
  return { conf: YAML.parse(rawConf), baseName };
}

function resolveOutput(file, out) {
  if (out == null) {
    return out;
  }
  return path.join(out, file.replace(/\.ech(idna)?/, ".lua"));
}

async function main() {
  if (options.config == null) {
    const [file] = program.args;
    if (file == null) {
      console.error(chalk`{red Wrong usage, see --help}`);
      process.exit(ErrorCodes.WRONG_USAGE);
    }
    compile(file, options.out);
  } else {
    const { conf, baseName } = tryParseConfig(options.config);
    if (conf.files == null) {
      log.config`{red ERROR! Configuration file does not contain input {bold files}!}`;
      process.exit(ErrorCodes.CONFIG_NO_INPUT_FILES);
    }
    const progress = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    progress.start(conf.files.length);
    for (const file of conf.files) {
      const filePath = path.join(baseName, file);
      const outDir = path.join(baseName, conf.outDir ?? "");
      const out = resolveOutput(file, outDir);
      await mkdirp(path.dirname(out));
      compile(filePath, out);
      progress.increment({ step: `Compiling ${file}` });
    }
    progress.update(conf.files.length, { step: "Done." });
    progress.stop();
    console.log(chalk`{green DONE} Compiled ${conf.files.length} files.`);
  }
}

main().catch((err) => {
  console.error(chalk`{red ${err}}`);
  process.exit(err.code ?? -1);
});
