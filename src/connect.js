import { EventEmitter } from 'events'
import { TelnetInput } from 'telnet-stream'
import { PassThrough } from 'stream'

const GMCP = 0xc9

const url = 'wss://cw2.twmuds.com/websocket/v1939'
// user / password
// done / done@cw2

// cmds
// load_map death
// sync_time
export default function() {
  const event = new EventEmitter
  const cli = new WebSocket(url)

  const pass = new PassThrough()
  const telnetInput = new TelnetInput()
  pass.pipe(telnetInput)

  telnetInput.on('data', data => {
    const text = new TextDecoder().decode(data)
    const lines = text.split('\n')
    for(let line of lines) {
      event.emit('line', line)
    }
  })
  telnetInput.on('do', data => console.log(`do ${data}`))
  telnetInput.on('will', data => console.log(`will ${data}`))
  telnetInput.on('command', data => console.log(`cmd ${data}`))
  telnetInput.on('sub', (sub, data) => {
    if(sub === GMCP) {
      event.emit('gmcp', data)
    }
  })

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
    pass.write(uarr)
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
