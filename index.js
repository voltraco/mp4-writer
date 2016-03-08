var mp4 = require('mp4-stream')
var fs = require('fs')
var inspect = require('util').inspect
var duplexify = require('duplexify')
var concat = require('concat-stream')

module.exports = function (cb) {
  return walkProps(['moov','udta','meta'], function (err, box, next) {
    var d = mp4.decode()
    var e = mp4.encode()
    d.on('box', function (hbox) {
      d.decode(function (sbox) {
        var type = sbox.buffer.slice(4,8).toString()
        if (type === 'data') {
          var len = sbox.buffer.readUInt32BE(8)
          var key = sbox.type
          var value
          if (key === 'trkn') {
            value = sbox.buffer.readUInt32BE(12+len)
          } else {
            value = sbox.buffer.slice(12 + 3 + len).toString()
          }
          var newrec = cb({ key: key, value: value })
          if (newrec) {
            sbox.type = newrec.key
            if (key === 'trkn') {
              sbox.buffer.writeUInt32BE(12+len)
            } else {
              sbox.buffer = Buffer.concat([
                sbox.buffer.slice(0, 12 + 3),
                Buffer(String(newrec.value))
              ])
            }
            e.box(sbox)
          }
        } else e.box(sbox)
      })
    })
    var offset = box.buffer.readUInt32BE(4) + 8 + 4
    var sbuf = box.buffer.slice(offset)
    e.pipe(concat(function (buf) {
      buf.copy(box.buffer, offset)
      next(null, box)
    }))
    d.end(sbuf)
  })
}

function walkProps (props, cb) {
  var d = mp4.decode()
  var e = mp4.encode()
  var stream = duplexify()
  stream.setWritable(d)
  d.on('box', function (hbox) {
    d.decode(function (box) {
      if (hbox.type !== props[0]) {
        stream.setReadable(e)
        e.box(box)
      } else if (props.length === 1) {
        stream.setReadable(e)
        cb(null, box, function (err, newbox) {
          if (err) return d.emit('error', err)
          stream.setReadable(e)
          if (newbox) e.box(newbox)
        })
      } else if (box.otherBoxes) {
        for (var i = 0; i < box.otherBoxes.length; i++) {
          var b = box.otherBoxes[i]
          if (b.type === props[1]) {
            var r = walkProps(props.slice(2), cb)
            stream.setReadable(r)
            r.end(b.buffer)
            return
          }
        }
        stream.setReadable(e)
        e.box(box)
      } else {
        stream.setReadable(e)
        e.box(box)
      }
    })
  })
  return stream
}
