const ql = require('./')
const queries = {
  user: ql.query('user', { id: 1 }),
  groups: ql.query('groups', null, { require: ['user'], atomic: false }),
  stuff: ql.query('stuff', null, { atomic: false })
}



const exe = require('./exe')()
exe.use('user', (params) => Promise.resolve({ name: 'bob' }))
exe.use('groups', (params) => new Promise((resolve, reject) => {
  setTimeout(() => resolve([
    { id: 1, name: 'Buses' },
    { id: 2, name: 'Planes' }
  ]), 1000)
}))

exe.missing((queries) => new Promise((resolve, reject) => {
  const results = {}
  for (let key of Object.keys(queries)) results[key] = [1, 2, 3]
  setTimeout(() => resolve(results), 3000)
}))
exe.on('update', (queries) => {
  console.log('update', queries)
})
exe.on('unknown', (queries) => {
  console.log('unknown', queries)
})
exe.on('error', (queries) => {
  console.log('error', queries)
})
exe.run(queries)
