const ql = require('./')
const queries = {
  user: ql.query('user', { id: 1 }, { cache: false })
}

const exe = require('./exe')()
exe.use('user', (params) => new Promise((resolve, reject) => {
  setTimeout(() => resolve(Date.now()), 5000)
}))

exe.on('update', (state) => {
  console.log('update', state)
})
exe.on('error', (errors) => {
  console.log('error', errors)
})
// exe.run(queries)

exe.now(queries).then((queries) => {
  console.log(queries)
})

// setTimeout(() => {
//   exe.run(queries)
// }, 1000)
