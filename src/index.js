const term = new Terminal()
term.open(document.getElementById('term'))

const url = 'wss://cw2.twmuds.com/websocket/v1939'
const cli = new WebSocket(url)
cli.binaryType = 'arraybuffer'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

cli.onerror = () => {
  console.log('conn errored')
}

cli.onopen = () => {
  console.log('conn opened')
  function cmd(cmd) {
    raw([0xff, 0xfa, 0xc9])
    raw(cmd)
    raw([0xff,0xf0]);
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

  window.c = {
    cli,
    cmd,
    send,
    raw,
    term,
  }
}

cli.onclose = () => {
  console.log('conn closed')
}

cli.onmessage = async e => {
  const arraybuffer = e.data
  const uarr = new Uint8Array(arraybuffer)
  const text = new TextDecoder().decode(uarr)
  console.log(text)
  await delay(1000)
  term.write(text)
}

