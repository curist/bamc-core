import { EventEmitter } from 'events'
import { TelnetInput } from 'telnet-stream'
import { PassThrough } from 'stream'
import debug from 'debug'

const GMCP = 0xc9

const STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
}

function bindTelnetInputEvents(event, encoding) {
  const telnetInput = new TelnetInput()

  const logline = debug('bamc:line')

  telnetInput.on('data', data => {
    const text = data.toString(encoding)
    const lines = text.split('\n')
    for(let line of lines) {
      logline(line)
      event.emit('line', line)
    }
  })
  const iacVerbs = [ 'do', 'dont', 'will', 'wont' ]
  for(let v of iacVerbs) {
    const log = debug(`bamc:iac:${v}`)
    telnetInput.on(v, option => {
      log(option)
      event.emit(`iac:${v}`, option)
    })
  }
  telnetInput.on('sub', (option, buffer) => {
    if(option === GMCP) {
      return event.emit('iac:sub:gmcp', buffer)
    }
    event.emit('iac:sub', { option, buffer })
  })

  return telnetInput
}

export default function(url, encoding='utf8') {
  const event = new EventEmitter
  const cli = new WebSocket(url)

  cli.binaryType = 'arraybuffer'

  let state = {
    status: STATUS.DISCONNECTED
  }

  event.getState = () => state

  const passthrough = new PassThrough()
  const telnetInput = bindTelnetInputEvents(event, encoding)
  passthrough.pipe(telnetInput)

  const log = debug('bamc:conn')

  cli.onclose = () => {
    log('conn close')
    event.emit('close')
  }

  cli.onerror = err => {
    log('conn error: %o', err)
    event.emit('error', err)
  }

  cli.onopen = () => {
    log('conn open')
    event.emit('open')
  }

  cli.onmessage = e => {
    const arraybuffer = e.data
    const uarr = new Uint8Array(arraybuffer)
    passthrough.write(uarr)
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
        break
      }
      case 'cmd': {
        const { message } = action
        cmd(message)
        break
      }
      case 'raw': {
        const { bytes } = action
        raw(bytes)
        break
      }
      default: return
    }
  })

  return event
}
