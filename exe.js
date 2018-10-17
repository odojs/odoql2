const equal = require('fast-deep-equal')

module.exports = () => {
  const providers = {}
  const listeners = { update: [], error: [] }
  let missingprovider = null

  let state = {}
  let cache = {}

  let plan = {
    tasks: [],
    atomic: {},

    ready: {},
    running: {},
    errors: {},
    complete: {}
  }

  const emit = (event, ...args) => {
    for (let listener of listeners[event]) listener(...args)
  }

  const querycomplete = (key, result) => {
    console.log('complete', key)
    const query = plan.running[key]
    if (query.options.cache || typeof query.options.cache == 'undefined')
      cache[key] = { query: query, value: result }
    delete plan.running[key]
    delete plan.atomic[key]
    plan.complete[key] = result
    state[key] = result
  }

  const queryerror = (key, error) => {
    console.log('error', key)
    delete plan.running[key]
    delete plan.atomic[key]
    plan.errors[key] = error
  }

  const executequery = (key, query) => {
    console.log('execute', key)
    let aborted = false
    plan.running[key] = query
    providers[query.name](query.params)
      .then((result) => {
        if (aborted) return
        querycomplete(key, result)
        evaluate()
      })
      .catch((error) => {
        if (aborted) return
        queryerror(key, result)
        evaluate()
      })
    return { abort: () => aborted = true }
  }

  const executemissing = (queries) => {
    console.log('missing', Object.keys(queries))
    let aborted = false
    missingprovider(queries)
      .then((results) => {
        if (aborted) return
        for (let key of Object.keys(results)) querycomplete(key, results[key])
        evaluate()
      })
      .catch((error) => {
        if (aborted) return
        for (let key of Object.keys(queries)) queryerror(key, error)
        evaluate()
      })
    return { abort: () => aborted = true }
  }

  const evaluate = () => {
    // check cache
    for (let key of Object.keys(plan.ready)) {
      const query = plan.ready[key]
      if (!cache[key]) continue
      const entry = cache[key]
      if (!equal(entry.query, query)) {
        delete cache[key]
        continue
      }
      delete plan.ready[key]
      delete plan.atomic[key]
      plan.complete[key] = entry.value
      state[key] = entry.value
    }

    // console.log('evaluate', plan)
    const errorscount = Object.keys(plan.errors).length
    const readycount = Object.keys(plan.ready).length
    const runningcount = Object.keys(plan.running).length
    const atomiccount = Object.keys(plan.atomic).length

    // we are finished
    if (readycount == 0 && runningcount == 0) {
      if (errorscount > 0) emit('error', plan.errors)
      emit('update', state)
      return
    }

    // we are atomic
    if (atomiccount == 0) emit('update', state)

    const missing = {}

    for (let key of Object.keys(plan.ready)) {
      const query = plan.ready[key]
      let isready = true
      if (query.options.require)
        for (let dep of query.options.require)
          if (!plan.complete[dep]) isready = false
      if (!isready) continue
      delete plan.ready[key]
      if (providers[query.name]) {
        plan.running[key] = query
        plan.tasks.push(executequery(key, query))
      }
      else if (missingprovider) {
        missing[key] = query
        plan.running[key] = query
      }
      else
        plan.errors[key] = `${query.name} not available in OdoQL`
    }

    if (Object.keys(missing).length > 0) executemissing(missing)
  }

  const run = (queries) => {
    if (Object.keys(plan.ready).length != 0 ||
      Object.keys(plan.running).length != 0)
      for (let task of plan.tasks) task.abort()
    plan = {
      tasks: [],
      atomic: {},
      errors: {},

      complete: {},
      ready: {},
      running: {}
    }
    for (let key of Object.keys(state)) if (!queries[key]) delete state[key]
    for (let key of Object.keys(queries)) {
      state[key] = null
      const query = queries[key]
      if (query.options.atomic || typeof query.options.atomic == 'undefined')
        plan.atomic[key] = query
      plan.ready[key] = query
    }
    evaluate()
  }

  return {
    use: (name, fn) => {
      if (providers[name]) throw new Error(`${name} already in use by OdoQL`)
      providers[name] = fn
    },
    on: (event, fn) => listeners[event].push(fn),
    off: (event, fn) => {
      const index = listeners[event].indexOf(fn)
      if (index > -1) listeners[event].splice(index, 1)
    },
    missing: (provider) => missingprovider = provider,
    run: run,
    clear: () => cache = {},
    clearQuery: (name) => {
      for (let key of Object.keys(cache))
        if (cache[key].query.name == name) delete cache[key]
    },
    clearKey: (key) => delete cache[key]
  }
}
