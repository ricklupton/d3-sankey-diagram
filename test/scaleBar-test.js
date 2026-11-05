import sankeyScaleBar, { niceValue, defaultFormat } from '../src/scaleBar.js'
import sankeyDiagram from '../src/diagram.js'
import sankey from '../src/sankey.js'

import getBody from './get-document-body.js'
import { select } from 'd3-selection'
import test from 'tape'

test('scaleBar: niceValue', t => {
  t.equal(niceValue(1, 50, [1, 2, 5]), 50, 'exact step')
  t.equal(niceValue(1, 100, [1, 2, 5]), 100, 'exact power of 10')
  t.equal(niceValue(0.1, 100, [1, 2, 5]), 1000, 'exact power of 10, rounding')
  t.equal(niceValue(1, 99, [1, 2, 5]), 50, 'rounds down')
  t.equal(niceValue(0.37, 50, [1, 2, 5]), 100, 'scale < 1')
  t.equal(niceValue(3, 50, [1, 2, 5]), 10, 'scale > 1')
  t.equal(niceValue(1e-6, 50, [1, 2, 5]), 5e7, 'large values')
  t.equal(niceValue(1, 30, [1, 2.5]), 25, 'custom steps')
  t.equal(niceValue(1, 3, [5]), 0.5, 'falls back to the next power of 10 down')
  t.ok(isNaN(niceValue(0, 50, [1, 2, 5])), 'zero scale')
  t.ok(isNaN(niceValue(null, 50, [1, 2, 5])), 'null scale')
  t.ok(isNaN(niceValue(Infinity, 50, [1, 2, 5])), 'infinite scale')
  t.end()
})

test('scaleBar: defaultFormat', t => {
  t.equal(defaultFormat(1), '1', '1')
  t.equal(defaultFormat(20), '20', '20')
  t.equal(defaultFormat(500), '500', 'keeps significant zeros')
  t.equal(defaultFormat(1000), '1k', 'drops trailing zeros')
  t.equal(defaultFormat(2500), '2.5k', 'drops some trailing zeros')
  t.equal(defaultFormat(1.25e6), '1.25M', 'no trailing zeros')
  t.equal(defaultFormat(0.02), '20m', 'small values')
  t.equal(defaultFormat(5e7), '50M', 'large values')
  t.end()
})

test('scaleBar: layout records scale on graph', t => {
  const layout = sankey().size([600, 400])
  const graph = layout(exampleCorners())
  t.equal(graph.scale, layout.scale(), 'graph.scale matches layout.scale()')
  t.ok(graph.scale > 0, 'scale is positive')

  layout.update(graph)
  t.equal(graph.scale, layout.scale(), 'graph.scale set by update()')
  t.end()
})

test('scaleBar: not rendered by default', t => {
  const graph = sankey().size([600, 400])(exampleCorners())
  const el = render(graph, sankeyDiagram())
  t.equal(el.selectAll('.scale-bar').size(), 0, 'no scale bar')
  t.end()
})

test('scaleBar: rendered by diagram using graph.scale', t => {
  const graph = sankey().nodePosition(d => d.pos).scale(1)(exampleCorners())
  const diagram = sankeyDiagram().scaleBar(sankeyScaleBar())
  const el = render(graph, diagram)

  const bar = el.selectAll('.scale-bar')
  t.equal(bar.size(), 1, 'one scale bar')
  t.equal(bar.datum(), graph, 'bound to graph')
  t.equal(bar.select('.scale-bar-line').attr('d'), 'M0,-4V0H50V-4',
    'bar length is nice value (50) times scale (1)')
  t.equal(bar.select('.scale-bar-label').text(), '50', 'label')

  // Re-render without scale bar removes it
  el.call(diagram.scaleBar(null))
  t.equal(el.selectAll('.scale-bar').size(), 0, 'scale bar removed')
  t.end()
})

test('scaleBar: explicit options', t => {
  const graph = sankey().nodePosition(d => d.pos).scale(1)(exampleCorners())
  const bar = sankeyScaleBar()
    .scale(2)
    .targetLength(100)
    .format(x => x + ' t')
  const el = render(graph, sankeyDiagram().scaleBar(bar))

  let sel = el.select('.scale-bar')
  t.equal(sel.select('.scale-bar-line').attr('d'), 'M0,-4V0H100V-4',
    'explicit scale overrides graph.scale')
  t.equal(sel.select('.scale-bar-label').text(), '50 t', 'custom format')

  el.call(sankeyDiagram().scaleBar(bar.value(10)))
  sel = el.select('.scale-bar')
  t.equal(sel.select('.scale-bar-line').attr('d'), 'M0,-4V0H20V-4',
    'fixed value')
  t.equal(sel.select('.scale-bar-label').text(), '10 t', 'fixed value label')

  el.call(sankeyDiagram().scaleBar(bar.position([-30, 25]).orientation('horizontal')))
  t.equal(el.select('.scale-bar').attr('transform'), 'translate(-30,25)',
    'explicit position, horizontal')

  el.call(sankeyDiagram().scaleBar(bar.orientation('vertical')))
  t.equal(el.select('.scale-bar').attr('transform'), 'translate(-30,25) rotate(-90)',
    'explicit position, vertical')
  t.end()
})

test('scaleBar: hidden when scale is unknown', t => {
  const graph = sankey().nodePosition(d => d.pos).scale(1)(exampleCorners())
  delete graph.scale
  const el = render(graph, sankeyDiagram().scaleBar(sankeyScaleBar()))
  t.equal(el.select('.scale-bar').style('display'), 'none', 'hidden')
  t.end()
})

test('scaleBar: default position is bottom-left of canvas', t => {
  const graph = sankey().nodePosition(d => d.pos).scale(1)(exampleCorners())
  const transform = (diagram, attrs) => {
    const el = select(getBody()).append('svg')
    Object.keys(attrs || {}).forEach(k => el.attr(k, attrs[k]))
    return el.datum(graph).call(diagram).select('.scale-bar').attr('transform')
  }
  const diagram = sankeyDiagram().scaleBar(sankeyScaleBar())

  // Vertical bar: the label (estimated 18px) is to the left of the line
  t.equal(transform(diagram, { height: 300 }),
    'translate(28,290) rotate(-90)', 'height attribute')
  t.equal(transform(diagram, { height: '300px' }),
    'translate(28,290) rotate(-90)', 'height attribute in px')
  t.equal(transform(diagram, { height: 300, viewBox: '0 0 500 200' }),
    'translate(28,190) rotate(-90)', 'viewBox takes precedence')
  t.equal(transform(diagram, { viewBox: '-5,-5,500,200' }),
    'translate(23,185) rotate(-90)', 'viewBox with offset')

  diagram.margins({ left: 50, top: 20, bottom: 30 })
  t.equal(transform(diagram, { height: 300 }),
    'translate(-22,270) rotate(-90)', 'independent of margins')
  t.equal(transform(diagram, {}),
    'translate(-22,120) rotate(-90)',
    'fallback when canvas size unknown: margin.bottom below lowest node')

  diagram.margins({ left: 0, top: 0, bottom: 0 })
  diagram.scaleBar().padding(0)
  t.equal(transform(diagram, { height: 300 }),
    'translate(18,300) rotate(-90)', 'padding')

  diagram.scaleBar().orientation('horizontal').padding(10)
  t.equal(transform(diagram, { height: 300 }),
    'translate(10,290)', 'horizontal')

  t.end()
})

test('scaleBar: standalone use', t => {
  const el = select(getBody()).append('svg').append('g')
  el.call(sankeyScaleBar().scale(0.5).position([10, 20]).orientation('horizontal'))
  t.equal(el.attr('class'), 'scale-bar', 'class set')
  t.equal(el.attr('transform'), 'translate(10,20)', 'position')
  t.equal(el.select('.scale-bar-line').attr('d'), 'M0,-4V0H50V-4', 'length')
  t.equal(el.select('.scale-bar-label').text(), '100', 'label')

  const el2 = select(getBody()).append('svg').attr('height', 200).append('g')
  el2.call(sankeyScaleBar().scale(0.5).orientation('horizontal'))
  t.equal(el2.attr('transform'), 'translate(10,190)', 'default position')
  t.end()
})

test('scaleBar: validates options', t => {
  t.throws(() => sankeyScaleBar().orientation('diagonal'), /orientation/)
  t.throws(() => sankeyScaleBar().position('bottom-left'), /position/)
  t.throws(() => sankeyScaleBar().labelAlign('left'), /labelAlign/)
  t.throws(() => sankeyDiagram().scaleBar(true), /scaleBar/)
  t.end()
})

function render (graph, diagram) {
  const el = select(getBody()).append('svg')
  el.datum(graph).call(diagram)
  return el
}

function exampleCorners (mirror) {
  // a is at the bottom left (y 60-100), b at the top right (y 0-40)
  return {
    nodes: [
      { id: 'a', pos: [0, mirror ? 0 : 60] },
      { id: 'b', pos: [200, mirror ? 60 : 0] }
    ],
    links: [
      { source: 'a', target: 'b', value: 40 }
    ]
  }
}
