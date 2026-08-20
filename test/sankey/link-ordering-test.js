import orderLinks from '../../src/sankeyLayout/link-ordering.js'
import prepareNodePorts from '../../src/sankeyLayout/prepare-subdivisions.js'
import tape from 'tape'
import { Graph } from '@dagrejs/graphlib'

tape('orderLinks() works between neighbouring layers', test => {
  const graph = new Graph({ directed: true, multigraph: true })
  graph.setNode('0', { x0: 0, x1: 1, y: 0 })
  graph.setNode('1', { x0: 0, x1: 1, y: 1 })
  graph.setNode('2', { x0: 0, x1: 1, y: 2 })
  graph.setNode('3', { x0: 0, x1: 1, y: 3 })
  graph.setNode('4', { x0: 2, x1: 3, y: 1.5 })
  graph.setEdge('0', '4', { dy: 1 })
  graph.setEdge('1', '4', { dy: 1 })
  graph.setEdge('2', '4', { dy: 1 })
  graph.setEdge('3', '4', { dy: 1 })
  prepareNodePorts(graph)
  orderLinks(graph)

  test.deepEqual(incoming(graph.node('4')), ['0', '1', '2', '3'],
    'incoming')

  // change ordering: put node 3 at top, node 0 at bottom
  graph.node('0').y = 3
  graph.node('3').y = 0
  prepareNodePorts(graph)
  orderLinks(graph)

  test.deepEqual(incoming(graph.node('4')), ['3', '1', '2', '0'],
    'node 4 incoming swapped')

  test.end()
})

tape('orderLinks() starting and ending in same slice', test => {
  //
  //     |--1--|
  //     ||-2-||
  //  0 --- 3 --- 6
  //     ||-4-||
  //     |--5--|
  //
  const graph = new Graph({ directed: true, multigraph: true })
  graph.setNode('0', { x0: 0, x1: 1, y: 4 })
  graph.setNode('1', { x0: 2, x1: 3, y: 0, direction: 'l' })
  graph.setNode('2', { x0: 2, x1: 3, y: 2, direction: 'l' })
  graph.setNode('3', { x0: 2, x1: 3, y: 4 })
  graph.setNode('4', { x0: 2, x1: 3, y: 10, direction: 'l' })
  graph.setNode('5', { x0: 2, x1: 3, y: 12, direction: 'l' })
  graph.setNode('6', { x0: 4, x1: 5, y: 4 })
  graph.setEdge('0', '3', { dy: 1 })
  graph.setEdge('1', '3', { dy: 1 })
  graph.setEdge('2', '3', { dy: 1 })
  graph.setEdge('4', '3', { dy: 1 })
  graph.setEdge('5', '3', { dy: 1 })
  graph.setEdge('3', '1', { dy: 1 })
  graph.setEdge('3', '2', { dy: 1 })
  graph.setEdge('3', '4', { dy: 1 })
  graph.setEdge('3', '5', { dy: 1 })
  graph.setEdge('3', '6', { dy: 1 })
  prepareNodePorts(graph)
  orderLinks(graph)

  test.deepEqual(incoming(graph.node('3'), 0), ['2', '1', '0', '5', '4'], 'incoming')
  test.deepEqual(outgoing(graph.node('3'), 1), ['2', '1', '6', '5', '4'], 'outgoing')
  test.end()
})

tape('orderLinks() sorts links with string types', test => {
  //
  //  0 --|
  //  1 --|2 -- 3
  //
  const graph = exampleTypes(['m2', 'm1'])

  prepareNodePorts(graph)
  orderLinks(graph)
  test.deepEqual(incoming(graph.node('2')), ['0/m1', '0/m2', '1/m1', '1/m2'], 'types not aligned')

  test.end()
})

tape('orderLinks() sorts links with numeric types', test => {
  //
  //  0 --|
  //  1 --|2 -- 3
  //
  const graph = exampleTypes([8, 7])

  prepareNodePorts(graph)
  orderLinks(graph)
  test.deepEqual(incoming(graph.node('2')), ['0/7', '0/8', '1/7', '1/8'], 'types not aligned')

  test.end()
})

tape('orderLinks() puts self-loops at the bottom', test => {
  const graph = new Graph({ directed: true, multigraph: true })
  graph.setNode('0', { x0: 0, x1: 1, y: 0 })
  graph.setNode('1', { x0: 2, x1: 3, y: 0 })
  graph.setNode('2', { x0: 4, x1: 5, y: 0 })
  graph.setEdge('0', '1', { dy: 1 })
  graph.setEdge('1', '1', { dy: 1 })
  graph.setEdge('1', '2', { dy: 1 })
  prepareNodePorts(graph)
  orderLinks(graph)

  test.deepEqual(outgoing(graph.node('1'), 1), ['2', '1'], 'node 1 outgoing')
  test.deepEqual(incoming(graph.node('1'), 0), ['0', '1'], 'node 1 incoming')
  test.end()
})

tape('orderLinks() keeps parallel links non-crossing as they turn around at a backwards node', test => {
  //        x = 0..1
  //
  //        +---+
  //   ---> | A |>-.   (r)   y=0
  //        +-+-+   \
  //                | types (p, q)
  //        +-+-+   /
  //        | B |<-`   (l)   y=5
  //        +---+
  //
  // For the curve to be non-crossing, p (the outer/wider loop) must sort
  // first (top) leaving A, and last (bottom) arriving at B; q (the
  // inner/tighter loop) is the mirror image.
  const graph = new Graph({ directed: true, multigraph: true })
  graph.setNode('A', { x0: 0, x1: 1, y: 0 })
  graph.setNode('B', { x0: 0, x1: 1, y: 5, direction: 'l', backwards: true })
  graph.setEdge('A', 'B', { dy: 1 }, 'p')
  graph.setEdge('A', 'B', { dy: 1 }, 'q')
  prepareNodePorts(graph)
  orderLinks(graph)

  test.deepEqual(outgoing(graph.node('A'), 0), ['B/p', 'B/q'], 'A outgoing: p on top')
  test.deepEqual(incoming(graph.node('B'), 0), ['A/q', 'A/p'], 'B incoming: p on bottom')
  test.end()
})

tape('orderLinks() keeps the flipped order through a run of backwards nodes, flipping back on return', test => {
  //        x = -4..-3              x = 0..1
  //
  //                              +---+
  //                         ---> | A +--.   (r)         y=0
  //                              +---+   \
  //        (l)                           |
  //       +---+                  +---+   /
  //    .--+ D |<-----------------+ B |<-`   (l)         y=5
  //   /   +---+                  +---+
  //   |
  //   \   +---+
  //    `->| E |  (r)                                    y=10
  //       +---+
  //
  // A (r) -> B (l) -> D (l) -> E (r) traces a backwards-S.
  //
  // p/q should flip order turning into B, stay flipped for the straight B -> D
  // run (still both backwards nodes), then flip back to their original order
  // turning into E.
  const graph = new Graph({ directed: true, multigraph: true })
  graph.setNode('A', { x0: 0, x1: 1, y: 0 })
  graph.setNode('B', { x0: 0, x1: 1, y: 5, direction: 'l', backwards: true })
  graph.setNode('D', { x0: -4, x1: -3, y: 5, direction: 'l', backwards: true })
  graph.setNode('E', { x0: -4, x1: -3, y: 10 })
  graph.setEdge('A', 'B', { dy: 1 }, 'p')
  graph.setEdge('A', 'B', { dy: 1 }, 'q')
  graph.setEdge('B', 'D', { dy: 1 }, 'p')
  graph.setEdge('B', 'D', { dy: 1 }, 'q')
  graph.setEdge('D', 'E', { dy: 1 }, 'p')
  graph.setEdge('D', 'E', { dy: 1 }, 'q')
  prepareNodePorts(graph)
  orderLinks(graph)

  test.deepEqual(outgoing(graph.node('A'), 0), ['B/p', 'B/q'], 'A outgoing: unflipped')
  test.deepEqual(incoming(graph.node('B'), 0), ['A/q', 'A/p'], 'B incoming: flipped')
  test.deepEqual(outgoing(graph.node('B'), 1), ['D/q', 'D/p'], 'B outgoing: still flipped')
  test.deepEqual(incoming(graph.node('D'), 0), ['B/q', 'B/p'], 'D incoming: still flipped')
  test.deepEqual(outgoing(graph.node('D'), 1), ['E/q', 'E/p'], 'D outgoing: still flipped')
  test.deepEqual(incoming(graph.node('E'), 0), ['D/p', 'D/q'], 'E incoming: flipped back')
  test.end()
})

function exampleTypes (types) {
  //
  //  0 --|
  //  1 --|2
  //
  const graph = new Graph({ directed: true, multigraph: true })
  graph.setNode('0', { x0: 0, x1: 1, y: 0 })
  graph.setNode('1', { x0: 0, x1: 1, y: 3 })
  graph.setNode('2', { x0: 2, x1: 3, y: 0 })
  types.forEach(m => {
    graph.setEdge('0', '2', { dy: 1 }, m)
    graph.setEdge('1', '2', { dy: 1 }, m)
  })
  return graph
}

function incoming (node, i) {
  if (i === undefined) i = 0
  return node.ports[i].incoming.map(e => e.v + (e.name ? '/' + e.name : ''))
}

function outgoing (node, i) {
  if (i === undefined) i = 0
  return node.ports[i].outgoing.map(e => e.w + (e.name ? '/' + e.name : ''))
}
