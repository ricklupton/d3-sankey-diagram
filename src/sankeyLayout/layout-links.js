/**
 * Edge positioning.
 *
 * @module link-positioning
 */

import { findFirst, sweepCurvatureInwards } from './utils.js'

/*
 * Requires incoming and outgoing attributes on nodes
 */
export default function layoutLinks (G) {
  setEdgeEndpoints(G)
  setEdgeCurvatures(G)
  return G
}

function setEdgeEndpoints (G) {
  G.nodes().forEach(u => {
    const node = G.node(u)

    let sy = node.y
    let ty = node.y

    node.fromElsewhere.forEach(link => {
      link.y1 = ty + link.dy / 2
      link.d1 = node.backwards ? 'l' : 'r'
      ty += link.dy
    })

    node.ports.forEach(port => {
      sy = node.y + port.y
      ty = node.y + port.y

      port.outgoing.forEach(e => {
        const link = G.edge(e)
        // link.x0 = node.x1
        link.y0 = sy + link.dy / 2
        link.d0 = node.backwards ? 'l' : 'r'
        sy += link.dy
      })

      port.incoming.forEach(e => {
        const link = G.edge(e)
        // link.x1 = node.x0
        link.y1 = ty + link.dy / 2
        link.d1 = node.backwards ? 'l' : 'r'
        ty += link.dy
      })
    })

    node.toElsewhere.forEach(link => {
      link.y0 = sy + link.dy / 2
      link.d0 = node.backwards ? 'l' : 'r'
      sy += link.dy
    })
  })
}

function setEdgeCurvatures (G) {
  G.nodes().forEach(u => {
    const node = G.node(u)
    setEdgeEndCurvatures(node.toElsewhere, 'r0')
    setEdgeEndCurvatures(node.fromElsewhere, 'r1')
    node.ports.forEach(port => {
      setEdgeEndCurvatures(port.outgoing.map(e => G.edge(e)), 'r0')
      setEdgeEndCurvatures(port.incoming.map(e => G.edge(e)), 'r1')
    })
  })
}

function maximumRadiusOfCurvature (link) {
  const Dx = link.x1 - link.x0
  const Dy = link.y1 - link.y0
  if (link.d0 !== link.d1) {
    return Math.abs(Dy) / 2.1
  } else {
    return (Dy !== 0) ? (Dx * Dx + Dy * Dy) / Math.abs(4 * Dy) : Infinity
  }
}

function setEdgeEndCurvatures (links, rr) {
  // initialise segments, find reversal of curvature
  links.forEach(link => {
    // const link = (i < 0) ? link.segments[link.segments.length + i] : link.segments[i]
    link.Rmax = maximumRadiusOfCurvature(link)
    link[rr] = Math.max(link.dy / 2, (link.d0 === link.d1 ? link.Rmax * 0.6 : (5 + link.dy / 2)))
  })

  let jmid = (rr === 'r0'
    ? findFirst(links, f => f.y1 > f.y0)
    : findFirst(links, f => f.y0 > f.y1))
  if (jmid === null) jmid = links.length

  // Set maximum radius down from middle
  sweepCurvatureInwards(links.slice(jmid), rr)

  // Set maximum radius up from middle
  if (jmid > 0) {
    const links2 = []
    for (let j = jmid - 1; j >= 0; j--) links2.push(links[j])
    sweepCurvatureInwards(links2, rr)
  }
}
