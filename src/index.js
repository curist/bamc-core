import './style.css'
import term from './term'
import connect from './connect'


async function main() {
  const event = connect()

  event.on('open', () => console.log('cli open'))

  event.on('data', uarr => {
    const text = new TextDecoder().decode(uarr)
    const lines = text.split('\n')

    const promptRxp = /> $/;
    term.write(lines.filter(l => !promptRxp.test(l)).join('\n'))

    const lastLine = lines.slice(-1)[0]
    if(promptRxp.test(lastLine)) {
      term.write(lastLine.replace(promptRxp, '\n\n'))
    }
  })

  event.on('gmcp', uarr => {
    const gmcpText = new TextDecoder().decode(uarr)
    $('pre').append('\n' + gmcpText)
    $('pre').scrollTop($('pre')[0].scrollHeight)
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
