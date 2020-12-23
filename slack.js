const fs = require('fs')
const path = require('path')
const axios = require('axios')
const assets = require('@liquality/cryptoassets')

const exit = () => process.exit(0)

const [event, _error, _job, _order] = process.argv.slice(2)
if (event !== 'success') exit()

const error = JSON.parse(_error)
if (error) exit()

const ALLOWED_JOBS = [
  'verify-user-init-tx',
  'reciprocate-init-swap',
  'find-claim-tx-or-refund',
  'agent-claim'
]

const job = JSON.parse(_job)
if (!job || !job.name || !ALLOWED_JOBS.includes(job.name)) exit()

const order = JSON.parse(_order)
if (!order || !order.orderId) exit()

const post = (url, data) => {
  return axios({
    url,
    method: 'POST',
    data
  }).then(res => res.data).catch(e => console.error(e))
}

module.exports = (url, logDir, explorer) => {
  const key = path.join(logDir, `${order.status}-${order.orderId}`)
  if (fs.existsSync(key)) return

  fs.closeSync(fs.openSync(key, 'w'))

  const fromAmount = assets[order.from].unitToCurrency(order.fromAmount).toNumber()
  const toAmount = assets[order.to].unitToCurrency(order.toAmount).toNumber()
  const markdown = Object.entries(order).map(([key, value]) => `${key}: ${value}`).join('\n')

  return post(url, {
    text: `\`${order.status}\` \`${order.orderId}\` \`${fromAmount} ${order.from} to ${toAmount} ${order.to}\``,
    attachments: [
      {
        title: `Order ${order.orderId}`,
        title_link: `${explorer}/${order.orderId}`,
        text: `\`\`\`${markdown}\`\`\``,
        type: 'mrkdwn'
      }
    ]
  })
}
