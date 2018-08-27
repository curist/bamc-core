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
      resolve(cli)
    }
  })
}
