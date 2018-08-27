const url = 'wss://cw2.twmuds.com/websocket/v1939'

export default async function() {
  const cli = new WebSocket(url)
  cli.binaryType = 'arraybuffer'

  cli.onclose = () => {
    console.info('conn closed')
  }

  return new Promise((resolve, reject) => {
    cli.onerror = err => {
      console.info('conn errored')
      console.error(err)
      reject(err)
    }

    cli.onopen = () => {
      console.log('conn opened')
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

      window.c = {
        cmd,
        send,
      }

      resolve(cli)
    }
  })
}
