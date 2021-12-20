const chalk = require("chalk");
const Service = require("../architecture/Service");
const Config = require("./Config");

module.exports = class Logger extends Service {
  #config = Config.instance;

  log(...args) {
    console.log(chalk(...args));
  }

  error(...args) {
    console.error(chalk`{red ${chalk(...args)}}`);
  }

  debug(...args) {
    console.log(process.env.DEBUG);
    if (this.#config.debug) {
      console.log(chalk`{blue <debug>} ${chalk(...args)}`);
    }
  }
};
