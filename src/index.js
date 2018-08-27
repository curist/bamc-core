import term from './term'
import connect from './connect'

async function main() {
  const cli = await connect()

  cli.onmessage = e => {
    const arraybuffer = e.data
    const uarr = new Uint8Array(arraybuffer)
    if(uarr.slice(0, 3).join(',') !== '255,250,201') {
      const text = new TextDecoder().decode(uarr)
      term.write(text)
      return
    }
    // FIXME it's possible message's fragmented
    for(let i = 3; i < uarr.length - 1; i++) {
      if(uarr[i] == 255 && uarr[i + 1] == 240) {
        const gmcpText = new TextDecoder().decode(uarr.slice(3, i))
        $('pre').append('\n' + gmcpText)
        const text = new TextDecoder().decode(uarr.slice(i + 2))
        term.write(text)
        return
      }
    }
    console.error('gmcp parsing error')
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

  $('form#send').on('submit', e => {
    e.preventDefault()
    const $input = $(e.target).find('input')
    const value = $input.val()
    send(value)
    $input.select()
  })
  $('form#cmd').on('submit', e => {
    e.preventDefault()
    const $input = $(e.target).find('input')
    const value = $input.val()
    cmd(value)
    $input.select()
  })
}

main()
