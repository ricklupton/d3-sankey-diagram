import tape from 'tape'
import sankey from '../src/sankey.js'

tape('sankey() has the expected defaults', test => {
  const s = sankey()
  test.equal(s.nodeId()({ id: 'foo' }), 'foo')
  // test.equal(s.nodeBackwards()({direction: 'l'}), true)
  test.deepEqual(s.sourceId()({ source: 'bar', sourcePort: 'a' }), { id: 'bar', port: 'a' })
  test.deepEqual(s.targetId()({ target: 'baz', targetPort: 'b' }), { id: 'baz', port: 'b' })
  test.equal(s.linkType()({ type: 'x' }), 'x')
  test.end()
})

tape('sankey(graph) builds the graph structure', test => {
  const s = sankey()
  const graph = s({
    nodes: [
      { id: 'a' },
      { id: 'b' }
    ],
    links: [
      { source: 'a', target: 'b', type: 'c' }
    ]
  })

  test.deepEqual(graph.nodes[0].incoming, [], 'node a incoming')
  test.deepEqual(graph.nodes[1].outgoing, [], 'node b outgoing')
  test.deepEqual(graph.nodes[0].outgoing, [graph.links[0]], 'node a outgoing')
  test.deepEqual(graph.nodes[1].incoming, [graph.links[0]], 'node b incoming')

  test.equal(graph.links[0].source, graph.nodes[0], 'link source')
  test.equal(graph.links[0].target, graph.nodes[1], 'link target')

  // original objects modified?
  // test.equal(l.source, 'a')
  test.end()
})

// tape('sankey(graph) sets port locations', test => {
//   test.deepEqual(graph.nodes[0].ports, [

//   ], 'node a ports')
//   {
//     id: '',
//     y: 0,
//     dy: 0,
//     incoming: [],
//     outgoing: [graph.links[0]]
//   }])
// test.deepEqual(graph.nodes[1].subdivisions, [{
//   id: '',
//   y: 0,
//   dy: 0,
//   incoming: [graph.links[0]],
//   outgoing: []
// }])

// test.deepEqual(graph.nodes[0].subdivisions, [{
//   id: '',
//   y: 0,
//   dy: 0,
//   incoming: [],
//   outgoing: [graph.links[0]]
// }])
// test.deepEqual(graph.nodes[1].subdivisions, [{
//   id: '',
//   y: 0,
//   dy: 0,
//   incoming: [graph.links[0]],
//   outgoing: []
// }])
// })

// tape('sankey(graph) can be called again', test => {
//   var input1 = {
//     nodes: [
//       {id: 'a'},
//       {id: 'b'}
//     ],
//     links: [
//       {source: 'a', target: 'b', type: 'c', value: 1}
//     ]
//   }

//   var input2 = {
//     nodes: [
//       {id: 'a'},
//       {id: 'b'}
//     ],
//     links: [
//       {source: 'a', target: 'b', type: 'c', value: 1}
//     ]
//   }

//   var graph1 = sankey()(input1)
//   var graph2 = sankey()(input2)
//   graph2 = sankey()(input2)

//   // console.log('links', graph1.links)
//   test.deepEqual(graph1.nodes[0], graph2.nodes[0])
//   test.end()
// })

tape('sankey(graph) sets node and link values and link type', test => {
  // Custom accessors so we can check .value and .type are really being set
  const s = sankey()
    .linkValue(function (d) { return d.val })
    .linkType(function (d) { return d.typ })

  const graph = s({
    nodes: [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' }
    ],
    links: [
      { source: 'a', target: 'b', typ: 'x', val: 7 },
      { source: 'a', target: 'b', typ: 'y', val: 2 },
      { source: 'b', target: 'c', typ: 'x', val: 3 }
    ]
  })

  test.equal(graph.links[0].type, 'x')
  test.equal(graph.links[1].type, 'y')
  test.equal(graph.links[2].type, 'x')
  test.equal(graph.links[0].value, 7)
  test.equal(graph.links[1].value, 2)
  test.equal(graph.links[2].value, 3)
  test.equal(graph.nodes[0].value, 9)
  test.equal(graph.nodes[1].value, 9)
  test.equal(graph.nodes[2].value, 3)
  test.end()
})

tape('sankey(nodes, edges) observes the specified id accessor functions', test => {
  const s = sankey()
    .nodeId(function (d) { return d.foo })
    .sourceId(function (d) { return d.bar })
    .targetId(function (d) { return d.baz })
    .linkType(function (d) { return d.fred })

  const graph = s({
    nodes: [
      { foo: 'a' },
      { foo: 'b' }
    ],
    links: [
      { bar: 'a', baz: 'b', fred: 'c' }
    ]
  })

  // test.equal(graph.nodes[0].id, 'a')
  // test.equal(graph.nodes[1].id, 'b')
  test.equal(graph.links[0].source, graph.nodes[0])
  test.equal(graph.links[0].target, graph.nodes[1])
  // test.equal(graph.links[0].type, 'c')
  test.end()
})

tape('nodeId() is given the node and its index', test => {
  const s = sankey().nodeId(function (d, i) { return i })
  const graph = s({ nodes: [{ id: 'a' }, { id: 'b' }], links: [{ source: 0, target: 1 }] })
  test.equal(graph.links[0].source.id, 'a')
  test.equal(graph.links[0].target.id, 'b')
  test.end()
})

tape('sankey.nodeId(id) tests that nodeId is a function', test => {
  const s = sankey()
  test.throws(function () { s.nodeId(42) })
  test.throws(function () { s.nodeId(null) })
  test.end()
})

tape('sankey.nodeBackwards(id) tests that nodeBackwards is a function', test => {
  const s = sankey()
  test.throws(function () { s.nodeBackwards(42) })
  test.throws(function () { s.nodeBackwards(null) })
  test.end()
})

tape('sankey.sourceId(id) tests that id is a function', test => {
  const s = sankey()
  test.throws(function () { s.sourceId(42) })
  test.throws(function () { s.sourceId(null) })
  test.end()
})

tape('sankey.targetId(id) tests that id is a function', test => {
  const s = sankey()
  test.throws(function () { s.targetId(42) })
  test.throws(function () { s.targetId(null) })
  test.end()
})

tape('sankey.linkType(id) tests that id is a function', test => {
  const s = sankey()
  test.throws(function () { s.linkType(42) })
  test.throws(function () { s.linkType(null) })
  test.end()
})

tape('sankey(graph) throws an error if a node is missing', test => {
  const s = sankey()
  test.throws(function () {
    s({ nodes: [], links: [{ source: 'a', target: 'b' }] })
  }, /\bmissing\b/)
  test.end()
})

tape('sankey(graph) throws an error if multiple nodes have the same id', test => {
  const s = sankey()
  test.throws(function () {
    s({ nodes: [{ id: 'a' }, { id: 'a' }], links: [] })
  }, /\bduplicate\b/)
  test.end()
})

// tape('sankey(graph) works with multiple links between same nodes', test => {
//   var s = sankey()
//   var graph = s({
//     nodes: [
//       {id: 'a'},
//       {id: 'b'}
//     ],
//     links: [
//       {source: 'a', target: 'b', type: 'c'},
//       {source: 'a', target: 'b', type: 'c'}
//     ]
//   })

//   test.deepEqual(graph.nodes[0].incoming, [])
//   test.deepEqual(graph.nodes[0].outgoing, [graph.links[0], graph.links[1]])
//   test.deepEqual(graph.nodes[1].incoming, [graph.links[0], graph.links[1]])
//   test.deepEqual(graph.nodes[1].outgoing, [])
//   test.equal(graph.links[0].source, graph.nodes[0])
//   test.equal(graph.links[0].target, graph.nodes[1])
//   test.equal(graph.links[1].source, graph.nodes[0])
//   test.equal(graph.links[1].target, graph.nodes[1])
//   test.end()
// })

// tape('sankey(graph) adds a new node if source or target id does not exist', test => {
//   var s = sankey()
//   var graph = s({nodes: [{id: 'a'}], links: [{source: 'a', target: 'b'}]})
//   test.equal(graph.nodes.length, 2)
//   test.equal(graph.nodes[0].id, 'a')
//   test.equal(graph.nodes[1].id, 'b')
//   test.end()
// })
