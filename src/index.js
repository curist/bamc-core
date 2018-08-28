import term from './term'
import connect from './connect'

// IAC WILL/WONT/DO/DONT always have one following byte
// IAC SB ends with IAC SE
const
  SE   = 0xF0, // end of subnegotiation
  SB   = 0xFA, // start of subnegotiation
  WILL = 0xFB,
  WONT = 0xFC,
  DO   = 0xFD,
  DONT = 0xFE,
  IAC  = 0xFF,  // Interpret As Command
  GMCP = 0xC9   // GMCP sequence (decimal 201)

async function main() {
  const event = connect()

  event.on('open', () => console.log('cli open'))

  // FIXME it's possible message's fragmented
  event.on('message', uarr => {
    if(uarr.slice(0, 3).join(',') !== '255,250,201') {
      const text = new TextDecoder().decode(uarr)
      term.write(text)
      return
    }
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
  })


  $('form#send').on('submit', e => {
    e.preventDefault()
    const $input = $(e.target).find('input')
    const value = $input.val()
    event.emit('action', {
      type: 'send',
      message: value
    })
    $input.select()
  })
  $('form#cmd').on('submit', e => {
    e.preventDefault()
    const $input = $(e.target).find('input')
    const value = $input.val()
    event.emit('action', {
      type: 'cmd',
      message: value
    })
    $input.select()
  })
}

main()
