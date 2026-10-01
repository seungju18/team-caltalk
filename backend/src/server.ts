import { app } from './app.ts'
import { config } from './config.ts'

app.listen(config.port, (err) => {
  if (err) throw err
  console.log(`server listening on :${config.port}`)
})
