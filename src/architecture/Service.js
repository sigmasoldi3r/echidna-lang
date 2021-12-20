const container = new Map();

module.exports = class Service {
  static get instance() {
    if (!container.has(this)) {
      container.set(this, new this());
    }
    return container.get(this);
  }
};
