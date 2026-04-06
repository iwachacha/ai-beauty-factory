import { createServer } from 'node:http'

const port = Number(process.env.MOCK_COMFYUI_PORT || 8188)
const oneByOnePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sWwaP4AAAAASUVORK5CYII=',
  'base64',
)

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(payload))
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://127.0.0.1:${port}`)

  if (request.method === 'POST' && url.pathname === '/prompt') {
    const promptId = `mock-${Date.now()}`
    sendJson(response, 200, { prompt_id: promptId })
    return
  }

  if (request.method === 'GET' && url.pathname.startsWith('/history/')) {
    const promptId = url.pathname.split('/').pop()
    sendJson(response, 200, {
      [promptId]: {
        outputs: {
          '9': {
            images: [
              {
                filename: `${promptId}.png`,
                subfolder: '',
                type: 'output',
              },
            ],
          },
        },
      },
    })
    return
  }

  if (request.method === 'GET' && url.pathname === '/view') {
    response.writeHead(200, { 'Content-Type': 'image/png' })
    response.end(oneByOnePng)
    return
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { ok: true })
    return
  }

  sendJson(response, 404, { message: 'Not found' })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`mock-comfyui listening on http://127.0.0.1:${port}`)
})
