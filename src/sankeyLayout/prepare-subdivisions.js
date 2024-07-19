import { map } from 'd3-collection'
import { sum } from 'd3-array'

export default function prepareNodePorts (G, sortPorts) {
  G.nodes().forEach(u => {
    const node = G.node(u)
    const ports = map()
    function getOrSet (id, side) {
      if (ports.has(id)) return ports.get(id)
      const port = { id, node: node.data, side, incoming: [], outgoing: [] }
      ports.set(id, port)
      return port
    }

    G.inEdges(u).forEach(e => {
      const edge = G.edge(e)
      const port = getOrSet(edge.targetPortId || 'in', node.direction !== 'l' ? 'west' : 'east')
      port.incoming.push(e)
      edge.targetPort = port
    })
    G.outEdges(u).forEach(e => {
      const edge = G.edge(e)
      const port = getOrSet(edge.sourcePortId || 'out', node.direction !== 'l' ? 'east' : 'west')
      port.outgoing.push(e)
      edge.sourcePort = port
    })

    node.ports = ports.values()
    node.ports.sort(sortPorts)

    // Initialise from/to elsewhere lists
    // XXX need to take more care with node directions
    node.fromElsewhere = node.fromElsewhere || []
    node.toElsewhere = node.toElsewhere || []
    let fromElsewhereDy = 0
    node.fromElsewhere.forEach(link => {
      link.x1 = node.x0
      fromElsewhereDy += link.dy
    })

    // Set positions of ports, roughly -- so the other endpoints of links are
    // known approximately when being sorted.
    const y = { west: fromElsewhereDy, east: 0 }
    const i = { west: 0, east: 0 }
    node.ports.forEach(port => {
      port.y = y[port.side]
      port.index = i[port.side]
      port.dy = Math.max(sum(port.incoming, e => G.edge(e).dy),
        sum(port.outgoing, e => G.edge(e).dy))
      const x = (port.side === 'west' ? node.x0 : node.x1)

      port.outgoing.forEach(e => {
        const link = G.edge(e)
        link.x0 = x
        link.y0 = node.y + port.y + link.dy / 2
      })
      port.incoming.forEach(e => {
        const link = G.edge(e)
        link.x1 = x
        link.y1 = node.y + port.y + link.dy / 2
      })
      y[port.side] += port.dy
      i[port.side] += 1
    })

    node.toElsewhere.forEach(link => {
      link.x0 = node.x1
    })
  })
}
