var mp4 = require('mp4-stream')
var fs = require('fs')
var inspect = require('util').inspect

fs.createReadStream(process.argv[2])
  .pipe(readProp(['moov','udta','meta'], function (err, box) {
    console.log(box.buffer.toString())
  }))

function readProp (props, cb) {
  var d = mp4.decode()
  d.on('box', function onbox (hbox) {
    if (hbox.type === props[0]) {
      d.decode(function (box) {
        if (props.length === 1) cb(null, box)
        else if (box.otherBoxes) {
          for (var i = 0; i < box.otherBoxes.length; i++) {
            var b = box.otherBoxes[i]
            if (b.type === props[1]) {
              return readProp(props.slice(2), cb).end(b.buffer)
            }
          }
          cb(null, undefined)
        } else cb(null, undefined)
      })
    } else d.ignore()
  })
  return d
}
