# openapi-compose
Bundle OpenAPI docs - resolve $refs to other files  
Use custom '$interits' operator to inherit whole or part of API  
Convert JSON &lt;-> YAML, build compact 'description'  
## Examples:  
```
node index.js compile path/to/api.json > compiled.api.json
node index.js compile path/to/api.yaml > compiled.api.json
node index.js compile-yaml path/to/api.json > compiled.api.yaml
node index.js to-yaml path/to/api.yaml > api.yaml
node index.js to-json path/to/api.json > api.json
node index.js description path/to/api.json > description.api.json
node index.js description path/to/api.yaml > description.api.json
```
