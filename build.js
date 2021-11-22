/*
  Project build script.
*/
const chalk = require("chalk");
const { statSync } = require("fs");
const rcedit = require("rcedit");
const pkg = require("./package.json");
const os = require("os");
const path = require("path");
const log = (...args) => console.log(chalk(...args));
const nexe = require("nexe");

const TARGET_VERSION = `windows-x64-14.15.3`;
const BINARIES_LOCATION = path.join(os.homedir(), `.nexe`, TARGET_VERSION);

function checkBinaries() {
  try {
    statSync(BINARIES_LOCATION);
    return true;
  } catch (err) {
    return false;
  }
}

async function main() {
  log`Detecting binaries at {green ${BINARIES_LOCATION}}`;
  if (!checkBinaries()) {
    log`{yellow WARN}: No binaries found, downloading...`;
    await nexe.compile({
      input: `./src/index.js`,
      output: `dist/echidna`,
    });
  }
  log`{blue Patching {bold Windows} binaries...}`;
  await rcedit(BINARIES_LOCATION, {
    "version-string": pkg.version,
    icon: "echidna.ico",
  });
  log`{blue nexe}: Building binaries...`;
  await nexe.compile({
    input: `./src/index.js`,
    ico: `./echidna.ico`,
    output: `dist/echidna`,
    fs: true,
  });
}

main().catch((err) => {
  console.error(chalk`{red ${err}}`);
  process.exit(-1);
});
