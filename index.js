const equal = require('fast-deep-equal')

module.exports = {
  query: (name, params, options) => {
    return { name: name, params: params, options: options || {} }
  },
  merge: (...args) => args.flat().reduce((a, b) => {
    const result = {}
    for (let key of Object.keys(a)) result[key] = a[key]
    for (let key of Object.keys(b)) {
      if (result[key]) {
        if (result[key].name !== b[key].name)
          console.error('Cannot merge OdoQL queries, names are different',
            `${result[key].name} !== ${b[key].name}`)
        else if (!equal(result[key].params, b[key].params))
          console.error('Cannot merge OdoQL queries, params are different',
            `${JSON.stringify(result[key].params)} !== ${JSON.stringify(b[key].params)}`)
        else if (b[key].options) {
          for (let option of Object.keys(b[key].options)) {
            const resultoption = results[key].options[option]
            const boption = b[key].options[option]
            if (resultoption && !equal(resultoption, boption))
              console.error('Cannot merge OdoQL queries, options are different',
                `${JSON.stringify(resultoption)} !== ${JSON.stringify(boption)}`)
            else
              results[key].options[option] = boption
          }
        }
      }
      else result[key] = b[key]
    }
    return result
  }),
  odojs: (component, spec) => {
    if (!spec.query) return component.query = () => {}
    component.query = (...args) => spec.query.apply(component, args)
  }
}
