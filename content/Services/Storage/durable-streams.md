# Durable Streams

Durable streams is a streaming storage service. As you're streaming something coming from an agent or a bunch of agents—maybe agents are watching the streams as they're going through—you stream it, modify, and it ends up being saved to a file that can be read later. It can be read many times.

## Built-in Access

It's a pretty powerful primitive. It comes out of the box in routes and agents—you can just access it. You create a stream, then just write stuff to the stream, and anything watching it will watch it as it's going through.

## Use Cases

Durable streams are great for multi-agent streaming where multiple agents watch and react to data as it flows, real-time processing where you modify and transform streaming data on the fly, and persistent output where streamed content is automatically saved for later retrieval. Pretty powerful.
