const equal = require('fast-deep-equal')

module.exports = {
  query: (name, params, options) => {
    return { name: name, params: params, options: options || {} }
  },
  merge: require('./merge'),
  odojs: (component, spec) => {
    if (!spec.query) return component.query = () => {}
    component.query = (...args) => spec.query.apply(component, args)
  }
}
