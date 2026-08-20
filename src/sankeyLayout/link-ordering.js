/** @module edge-ordering */

import linkDirection from './link-direction.js'

/**
 * Order the edges at all nodes.
 */
export default function orderEdges (G, opts) {
  G.nodes().forEach(u => orderEdgesOne(G, u, opts))
}

/**
 * Order the edges at the given node.
 * The ports have already been setup and sorted.
 */
function orderEdgesOne (G, v) {
  const node = G.node(v)
  node.ports.forEach(port => {
    port.incoming.sort(compareDirection(G, node, false))
    port.outgoing.sort(compareDirection(G, node, true))
  })
}

/**
 * Sort links based on their endpoints & type
 */
function compareDirection (G, node, head = true) {
  return function (a, b) {
    const da = linkDirection(G, a, head)
    const db = linkDirection(G, b, head)
    const c = head ? 1 : -1

    // links between same node, sort on type
    if (a.v === b.v && a.w === b.w && Math.abs(da - db) < 1e-3) {
      let byName
      if (typeof a.name === 'number' && typeof b.name === 'number') {
        byName = a.name - b.name
      } else if (typeof a.name === 'string' && typeof b.name === 'string') {
        byName = a.name.localeCompare(b.name)
      } else {
        byName = 0
      }

      // Backwards ('l') nodes read right-to-left, so parallel links must be
      // sorted in the opposite order to keep the same physical link on the
      // outside of the bend as it turns around.
      return node.backwards ? -byName : byName
    }

    // loops to same slice based on y-position
    if (Math.abs(da - db) < 1e-3) {
      if (a.w === b.w) {
        return G.node(b.v).y - G.node(a.v).y
      } else if (a.v === b.v) {
        return G.node(b.w).y - G.node(a.w).y
      } else {
        return 0
      }
    }

    // otherwise sort by direction
    return c * (da - db)
  }
}
