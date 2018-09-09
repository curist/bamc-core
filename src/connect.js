import { EventEmitter } from 'events'

import { TelnetInput } from 'telnet-stream'
const telnetInput = new TelnetInput();

const { PassThrough } = require('stream');
const pass = new PassThrough();

pass.pipe(telnetInput)

telnetInput.on('data', data => console.log(`data ${data}`))
telnetInput.on('do', data => console.log(`do ${data}`))
telnetInput.on('will', data => console.log(`will ${data}`))
telnetInput.on('command', data => console.log(`cmd ${data}`))
telnetInput.on('sub', (...data) => console.log(`sub ${data}`))

pass.on('data', chunk => console.log('chunk: ' + chunk.toString()))
pass.write('ok')
pass.write(new Uint8Array([0xff, 0xfd, 0xc9]))
pass.write(new Uint8Array([0xff, 0xfa, 0xc9, 0x61, 0x62, 0x63, 0xff, 0xf0, 0x61]))


const url = 'wss://cw2.twmuds.com/websocket/v1939'
// user / password
// done / done@cw2

// cmds
// load_map death
// sync_time
export default function() {
  const event = new EventEmitter
  const cli = {} // new WebSocket(url)

  cli.binaryType = 'arraybuffer'

  cli.onclose = () => {
    console.info('conn close')
    event.emit('close')
  }

  cli.onerror = err => {
    console.info('conn error')
    console.error(err)
    event.emit('error', err)
  }

  cli.onopen = () => {
    console.info('conn open')
    event.emit('open')
  }

  cli.onmessage = e => {
    const arraybuffer = e.data
    const uarr = new Uint8Array(arraybuffer)
    event.emit('message', uarr)
  }

  function cmd(cmd) {
    raw([0xff, 0xfa, 0xc9])
    raw(cmd)
    raw([0xff, 0xf0]);
  }

  function send(msg) {
    raw(`${msg}\n`)
  }

  function raw(bytes) {
    if(typeof bytes == 'string') {
      cli.send(bytes)
      return
    }
    cli.send(new Uint8Array(bytes))
  }

  event.on('action', action => {
    const { type } = action

    switch(type) {
      case 'send': {
        const { message } = action
        send(message)
      }
      case 'cmd': {
        const { message } = action
        cmd(message)
      }
      default: return
    }
  })

  return event
}
