var toxy = require('toxy')
var poisons = toxy.poisons
var rules = toxy.rules

// Create a new toxy proxy
var proxy = toxy()

// Default server to forward incoming traffic
proxy.forward('http://localhost:8000')

// Register global poisons and rules
proxy.get('*').poison(proxy.poisons.bandwidth({ bytes: 32 }))

proxy.listen(8001)

console.log('Toxy proxy is listening on port:', 8001, 'forwarding on:', 8000)
