import { EventEmitter } from 'events'
// import { Writable } from 'stream'
// import { TelnetInput } from 'telnet-stream'
// console.log(TelnetInput)

const url = 'wss://cw2.twmuds.com/websocket/v1939'
// user / password
// done / done@cw2

// cmds
// load_map death
// sync_time
export default function() {
  const event = new EventEmitter
  const cli = new WebSocket(url)

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
