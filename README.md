# PowerUs Flights

## Setup

You need to install NodeJS on your machine. For the best experience VSCode is also recommended.
To install the repositories dependencies run

```
npm i
```

## API

The core part of this repository is the PowerUs Flights API
which provides an endpoint to receive flight data from several sources.
You can run the server with the command

```
npx nx run flights:serve
```

which means that we run the *serve* target of the *flights app*. The configuration for the
app is available in the [project.json](./apps/flights/project.json). The server is then
available under http://localhost:3333/api.

### API Interaction

To test the API manually, you can either open your browser and type http://localhost:3333/api/flights,
which performs an HTTP get request to that URL. Or you install the VSCode extension
[Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client) and
import the collection saved under **./tools/powerus-flights-api-collection.json**.