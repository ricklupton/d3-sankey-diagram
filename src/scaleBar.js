// Scale bar showing the relationship between flow value and link width

import { select } from 'd3-selection'
import { transition } from 'd3-transition'
import { format } from 'd3-format'

// Approximate text metrics, used only to keep the label inside the canvas when
// positioning the bar by default. Assumes a ~12px font.
const FONT_SIZE = 12
const CHAR_WIDTH = 0.6 * FONT_SIZE

// Geometry of the bar itself, in local coordinates where the bar runs along
// the x axis from 0 to `length`, and the ticks and label sit at negative y.
const TICK_LENGTH = 4
const LABEL_GAP = 6

export default function sankeyScaleBar () {
  let scale = null
  let targetLength = 50
  let steps = [1, 2, 5]
  let value = null
  let orientation = 'vertical'
  let position = null
  let padding = 10
  let labelAlign = 'start'
  let fmt = defaultFormat

  function scaleBar (context, margins) {
    const selection = context.selection ? context.selection() : context

    selection.each(function (G) {
      const g = select(this)
      const k = (scale !== null) ? scale : (G && G.scale)
      const v = (value !== null) ? value : niceValue(k, targetLength, steps)
      const length = v * k

      g.classed('scale-bar', true)

      if (!(isFinite(length) && length > 0)) {
        g.style('display', 'none')
        return
      }
      g.style('display', null)

      const labelText = fmt(v)
      const local = localBox(length, labelText, labelAlign)
      const box = (orientation === 'vertical')
        ? { x0: local.y0, x1: local.y1, y0: -local.x1, y1: -local.x0 }
        : local
      const origin = position || defaultPosition(this, G, box, padding, margins)

      if (g.select('.scale-bar-line').empty()) {
        g.append('path')
          .attr('class', 'scale-bar-line')
          .attr('fill', 'none')
          .attr('stroke', 'currentColor')
        g.append('text')
          .attr('class', 'scale-bar-label')
          .attr('fill', 'currentColor')
      }

      const transform = 'translate(' + origin[0] + ',' + origin[1] + ')' +
            (orientation === 'vertical' ? ' rotate(-90)' : '')
      const linePath = 'M0,' + (-TICK_LENGTH) + 'V0H' + length + 'V' + (-TICK_LENGTH)
      const labelX = (labelAlign === 'middle')
        ? length / 2
        : (labelAlign === 'end' ? length : 0)

      const label = g.select('.scale-bar-label')
        .attr('y', -LABEL_GAP)
        .attr('text-anchor', labelAlign)
        .text(labelText)

      if (context instanceof transition) {
        const t = select(this).transition(context)
        t.attr('transform', transform)
        t.select('.scale-bar-line').attr('d', linePath)
        t.select('.scale-bar-label').attr('x', labelX)
      } else {
        g.attr('transform', transform)
        g.select('.scale-bar-line').attr('d', linePath)
        label.attr('x', labelX)
      }
    })
  }

  scaleBar.scale = function (_x) {
    if (!arguments.length) return scale
    scale = (_x === null) ? null : +_x
    return scaleBar
  }

  scaleBar.targetLength = function (_x) {
    if (!arguments.length) return targetLength
    targetLength = +_x
    return scaleBar
  }

  scaleBar.steps = function (_x) {
    if (!arguments.length) return steps
    steps = Array.from(_x, Number)
    return scaleBar
  }

  scaleBar.value = function (_x) {
    if (!arguments.length) return value
    value = (_x === null) ? null : +_x
    return scaleBar
  }

  scaleBar.orientation = function (_x) {
    if (!arguments.length) return orientation
    if (_x !== 'vertical' && _x !== 'horizontal') {
      throw new Error('orientation must be "vertical" or "horizontal"')
    }
    orientation = _x
    return scaleBar
  }

  scaleBar.position = function (_x) {
    if (!arguments.length) return position
    if (_x !== null && !(Array.isArray(_x) && _x.length === 2)) {
      throw new Error('position must be [x, y] or null')
    }
    position = _x
    return scaleBar
  }

  scaleBar.padding = function (_x) {
    if (!arguments.length) return padding
    padding = +_x
    return scaleBar
  }

  scaleBar.labelAlign = function (_x) {
    if (!arguments.length) return labelAlign
    if (['start', 'middle', 'end'].indexOf(_x) < 0) {
      throw new Error('labelAlign must be "start", "middle" or "end"')
    }
    labelAlign = _x
    return scaleBar
  }

  scaleBar.format = function (_x) {
    if (!arguments.length) return fmt
    if (typeof _x !== 'function') throw new Error('format must be a function')
    fmt = _x
    return scaleBar
  }

  return scaleBar
}

const siFormat = format('.3s')

/**
 * Format with SI prefix to 3 significant figures, dropping trailing zeros
 * (e.g. "1k" rather than "1.00k"). Equivalent to d3.format('.3~s'), which
 * needs d3-format v1.3 or later (not included in d3 v4).
 */
export function defaultFormat (x) {
  return siFormat(x).replace(/\.0+(?=\D*$)|(\.\d*[1-9])0+(?=\D*$)/, '$1')
}

/**
 * Choose a "nice" value (one of `steps` times a power of 10) whose length at
 * the given scale is as long as possible without exceeding `targetLength`.
 */
export function niceValue (scale, targetLength, steps) {
  if (!(scale > 0) || !(targetLength > 0) || !isFinite(scale)) return NaN
  const target = targetLength / scale
  // Allow for rounding error when the target is exactly a nice value
  const limit = target * (1 + 1e-9)
  const exponent = Math.floor(Math.log10(target))
  let best = NaN
  for (let e = exponent - 1; e <= exponent + 1; e++) {
    const p = Math.pow(10, e)
    steps.forEach(s => {
      const candidate = s * p
      if (candidate <= limit && !(candidate <= best)) best = candidate
    })
  }
  return best
}

// Bounding box of the bar and its label in local (unrotated) coordinates
function localBox (length, labelText, labelAlign) {
  const textWidth = estimateTextWidth(labelText)
  let t0
  if (labelAlign === 'middle') {
    t0 = length / 2 - textWidth / 2
  } else if (labelAlign === 'end') {
    t0 = length - textWidth
  } else {
    t0 = 0
  }
  return {
    x0: Math.min(0, t0),
    x1: Math.max(length, t0 + textWidth),
    y0: -(LABEL_GAP + FONT_SIZE),
    y1: 0
  }
}

/**
 * Position the bar in the bottom-left corner of the SVG canvas, inset by
 * `padding`. `margins` is the offset of the diagram's coordinate system from
 * the canvas origin (zero when used standalone).
 */
function defaultPosition (el, G, box, padding, margins) {
  const m = margins || { left: 0, top: 0, bottom: 0 }
  let canvas = canvasBounds(el)
  if (!canvas) {
    // Canvas size unknown: assume it ends `margins.bottom` below the lowest node
    const nodes = (G && G.nodes) || []
    const bottom = nodes.length ? Math.max.apply(null, nodes.map(d => d.y1)) : 0
    canvas = { x: 0, y: 0, height: m.top + bottom + m.bottom }
  }
  return [
    canvas.x - m.left + padding - box.x0,
    canvas.y + canvas.height - m.top - padding - box.y1
  ]
}

/**
 * Find the visible area of the nearest enclosing SVG element: its viewBox if
 * set, otherwise its width and height attributes (in px), otherwise its
 * rendered size.
 */
function canvasBounds (el) {
  let svg = el
  while (svg && !(svg.nodeName && svg.nodeName.toLowerCase() === 'svg')) {
    svg = svg.parentNode
  }
  if (!svg || !svg.getAttribute) return null

  const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number)
  if (viewBox.length === 4 && viewBox.every(isFinite) && viewBox[3] > 0) {
    return { x: viewBox[0], y: viewBox[1], height: viewBox[3] }
  }

  const height = svg.getAttribute('height')
  if (/^\s*[\d.]+(px)?\s*$/.test(height || '') && parseFloat(height) > 0) {
    return { x: 0, y: 0, height: parseFloat(height) }
  }

  if (svg.getBoundingClientRect) {
    const rect = svg.getBoundingClientRect()
    if (rect.height > 0) return { x: 0, y: 0, height: rect.height }
  }

  return null
}

function estimateTextWidth (text) {
  return String(text).length * CHAR_WIDTH
}
