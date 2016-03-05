var mp4 = require('mp4-stream')
var fs = require('fs')
var inspect = require('util').inspect

var d = mp4.decode()
d.on('box', function (headers) {
  d.decode(function (box) {
    console.log(inspect(box,0,10))
  })
})
fs.createReadStream(process.argv[2]).pipe(d)
