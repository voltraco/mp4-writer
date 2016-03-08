var metaWriter = require('../')
var fs = require('fs')
var xtend = require('xtend')
var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { o: 'outfile', i: 'infile' }
})

if (argv._[0] === 'show') {
  fs.createReadStream(argv.infile)
    .pipe(metaWriter(function (err, meta, next) {
      console.log(meta)
    }))
} else if (argv._[0] === 'set') {
  var updates = {}
  argv._.slice(1).forEach(function (kv) {
    var s = kv.split(':'), key = s[0], value = s[1]
    updates[key] = value
  })
  fs.createReadStream(argv.infile)
    .pipe(metaWriter(function (rec, next) {
      if (updates.hasOwnProperty(rec.key)) {
        rec.value = updates[rec.key]
      }
      return rec
    }))
    .pipe(fs.createWriteStream(argv.outfile))
}
