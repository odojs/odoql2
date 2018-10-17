const ql = require('./')
const queries = {
  user: ql.query('user', { id: 1 }, { cache: false })
}

const exe = require('./exe')()
exe.use('user', (params) => new Promise((resolve, reject) => {
  setTimeout(() => resolve(Date.now()), 5000)
}))

exe.on('update', (queries) => {
  console.log('update', queries)
})
exe.on('error', (queries) => {
  console.log('error', queries)
})
exe.run(queries)


setTimeout(() => {
  exe.run(queries)
}, 1000)
