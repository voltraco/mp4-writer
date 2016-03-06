var writer = require('../')
var fs = require('fs')
var xtend = require('xtend')

fs.createReadStream(process.argv[2])
  .pipe(writer(function (err, meta, next) {
    next(null, xtend(meta, {
      ')nam': 'whatever'
    }))
  }))
