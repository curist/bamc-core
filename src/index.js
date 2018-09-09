import './style.css'
import term from './term'
import connect from './connect'

const USERNAME = 'done'
const PASSWORD = 'done@cw2'

async function main() {
  const event = connect()

  event.on('open', () => console.log('cli open'))

  event.on('line', line => {
    const promptRgx = /> $/
    const csiRgx = /\x1b\[[0-9;]*[a-zA-Z]/g

    // console.log(line.replace(csiRgx, ''))

    if(!promptRgx.test(line)) {
      term.write(line)
    } else {
      term.write(line.replace(promptRgx, '\n'))
    }
    term.write('\n')
  })

  event.on('gmcp', uarr => {
    const gmcpText = new TextDecoder().decode(uarr)
    $('pre').append('\n' + gmcpText)
    $('pre').scrollTop($('pre')[0].scrollHeight)
  })

  event.on('gmcp', uarr => {
    const text = new TextDecoder().decode(uarr)
    const [cmd, ...data] = text.split(' ')
    switch(cmd) {
      case 'auto-login.username': {
        return event.emit('action', {
          type: 'send',
          message: USERNAME,
        })
      }
      case 'auto-login.password': {
        return event.emit('action', {
          type: 'send',
          message: PASSWORD
        })
      }
    }
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
    term.write(`${value}\n`)
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
