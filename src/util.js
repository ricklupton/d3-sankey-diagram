import { Graph } from 'graphlib'

export function buildGraph (graph, nodeId, nodeBackwards, sourceId, targetId, linkType, linkValue) {
  var G = new Graph({ directed: true, multigraph: true })
  graph.nodes.forEach(function (node, i) {
    const id = nodeId(node, i)
    if (G.hasNode(id)) throw new Error('duplicate: ' + id)
    G.setNode(id, {
      data: node,
      index: i,
      backwards: nodeBackwards(node, i),
      // XXX don't need these now have nodePositions?
      x0: node.x0,
      x1: node.x1,
      y: node.y0
    })

    // These are for "short" links in/out of a node
    if (node.from_elsewhere && node.from_elsewhere.length > 0) {
      G.setNode("__from_elsewhere_" + id, {
        elsewhere: true
      })
      node.from_elsewhere.forEach(function (link, i) {
        let label = {
          data: link,
          sourcePortId: null,
          targetPortId: "__from_elsewhere",
          index: i,
          points: [],
          value: linkValue(link, i),
          type: linkType(link, i)
        }
        G.setEdge("__from_elsewhere_" + id, id, label, linkType(link))
      })
    }
    if (node.to_elsewhere && node.to_elsewhere.length > 0) {
      G.setNode("__to_elsewhere_" + id, {
        elsewhere: true
      })
    }
  })

  graph.links.forEach(function (link, i) {
    const v = idAndPort(sourceId(link, i))
    const w = idAndPort(targetId(link, i))
    var label = {
      data: link,
      sourcePortId: v.port,
      targetPortId: w.port,
      index: i,
      points: [],
      value: linkValue(link, i),
      type: linkType(link, i)
    }
    if (!G.hasNode(v.id)) throw new Error('missing: ' + v.id)
    if (!G.hasNode(w.id)) throw new Error('missing: ' + w.id)
    G.setEdge(v.id, w.id, label, linkType(link, i))
  })

  G.setGraph({})

  return G
}

function idAndPort (x) {
  if (typeof x === 'object') return x
  return {id: x, port: undefined}
}
