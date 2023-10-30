import { select } from 'd3-selection'


export default function () {
  // console.log("from inside the function", d);
  let nodeTitle = (d) => d.title !== undefined ? d.title : d.id
  let nodeValue = (d) => null
  let nodeVisible = (d) => !!nodeTitle(d)


  function sankeyNode(context) { 

    const selection = context.selection ? context.selection() : context
        // Define the arc properties
    const centerX = 100; // X-coordinate of the center
    const centerY = 100; // Y-coordinate of the center
    const radius = 80;   // Radius of the arc
    const startAngle = 0; // Starting angle in radians
    const endAngle = Math.PI / 2; // Ending angle in radians (quarter circle)

    const innerRadius = 20;
    const outerRadius = 40;

    if (selection.select('text').empty()) {
      // selection.append('title')
      // selection.append("rect")
      // .attr("class", "tooltip")
      // .attr("width", 200)
      // .attr("height", 100)
      // .attr('fill', 'red')
      // .attr("rx", 10) // Horizontal corner radius
      // .attr("ry", 10) 
      // .style('display', "none")

      // .style("display", "none")
      // .style("background", "rgba(69,77,93,.9)")
      // .style("border-radius", ".2rem")
      // .style("color", "#fff")
      // .style("padding", ".6rem")
      // .style("position", "absolute")
      // .style("text-overflow", "ellipsis")
      // .style("white-space", "pre")
      // .style("line-height", "1em")
      // .style("z-index", "300")
      

      // selection.append("rect")
      // .attr('width', 1000)
      // .style('fill', 'red')


      selection.append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('stroke-width', 100)
        .attr('fill', 'blue')
      selection.append('rect')
        .attr('class', 'node-body')
        // .attr('width', 250)
        // .attr('height', 350)
        .attr('fill', 'rgb(169,206,127)')
        // .attr('fill', nodeBackgroundColor)
        // .attr('stroke', 'black') // Border color
        // .attr('stroke-width', '1');
      selection.append('text')
        .attr('class', 'node-value')
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
      
      selection.append('text')
        .attr('class', 'node-value2')
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
     
      selection.append('rect')
        .attr('class', 'node-click-target')
        .attr('x', -15)
        .attr('y', -15)
        .attr('width', 100)
        .style('fill', 'none')
        .style('visibility', 'visible')
        .style('pointer-events', 'all')
    
      selection.append('rect')
        .attr('class', 'dropoff')
        .attr('fill', 'rgb(227,69,64)')
        // .attr('width', 20)  
        // .attr('height', 20)

      selection
        .attr('transform', nodeTransform)
    }

    selection.each(function (d) {
      let title = select(this).select('title')
      let tooltip = select(this).select('.tooltip')
      let value = select(this).select('.node-value')
      let value2 = select(this).select('.node-value2');
      let text = select(this).select('.node-title')
      let line = select(this).select('line')
      let body = select(this).select('.node-body')
      let clickTarget = select(this).select('.node-click-target')
      // select the dropoff and apply styles
      const dropoff = select(this).select('.dropoff')
      d.x1 = d.x0 + 125; // width of node

      // Local var for title position of each node
      const layoutData = titlePosition(d)
      layoutData.dy = (d.y0 === d.y1) ? 0 : Math.max(1, d.y1 - d.y0)
      
      const separateValue = (d.x1 - d.x0) > 2
      const titleText = nodeTitle(d) + ((!separateValue && nodeValue(d))
        ? ' (' + nodeValue(d) + ')' : '')

      // Update un-transitioned
      // title
      //   .attr('fill', 'yellow')
      //   .attr('stroke', 'red')
      //   .attr('width', '200px')
      //   .text('wewe')



      selection.on('mouseover', () => {
        console.log('movus is over');
        tooltip.style("display", "block")
      });

      selection.on('mouseout', () => {
        console.log('mouse is out');
        tooltip.style("display", "none")
      });
        

      value
        .text(d.value > 0 ? titleText:  "")
        .style('display', separateValue ? 'inline' : 'none')
        .style('fill', 'black') // sets the text inside box
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('font-family', 'Poppins')
        .style('opacity', d.opacity);

      // value2
      // .text(titleText)
      // .style('display', separateValue ? 'inline' : 'none')
      // .style('fill', 'black') // sets the text inside box
      // .style('font-size', '12px')
      // .style('font-weight', 'bold'); 

      value2
        .text(`➡ ${d.population && d.population.toFixed(2)}%`)
        .style('display', separateValue ? 'inline' : 'none')
        .style('fill', 'black') // sets the text inside box
        .style('font-size', '6px')
        .style('font-weight', 'bold')
        .style('opacity', d.opacity);



      text
        .attr('text-anchor', layoutData.right ? 'end' : 'start')
        .text(titleText)
        .each(wrap, 100)

      // Are we in a transition?
      if (context !== selection) {
        text = text.transition(context)
        line = line.transition(context)
        body = body.transition(context)
        tooltip = tooltip.transition(context)

        clickTarget = clickTarget.transition(context)
      }

      // dropoff NOde
      const dropoffOffset = (d.y1 - d.y0 ) * (1- d.dropoff/100);
      dropoff
        .attr('transform', `translate(125, ${dropoffOffset})`)
        .attr('width', 10)
        .attr('height', ((d.dropoff) * (d.dy))/100)
        .attr('fill', d.dropoff_color)
        


      // Update  translate(' + d.x0 + ',' + d.y0 + ')'
      context
        .attr('transform', nodeTransform)



      line
        .attr('y1', function (d) { return layoutData.titleAbove ? -5 : 0 })
        .attr('y2', function (d) { return layoutData.dy })
        .style('display', function (d) {
          return (d.y0 === d.y1 || !nodeVisible(d)) ? 'none' : 'inline'
        })

      clickTarget
        .attr('height', function (d) { return layoutData.dy + 5 })

      body
        .attr('fill', d.backgroundColor)
        // .attr('stroke-opacity', 0.5)
        // .attr('fill-opacity', 0.5)
        // .attr('width', function (d) { return d.x1 - d.x0 })   //d.x1 - d.x0
        .attr('width', function (d) { return d.x1 - d.x0 })   //d.x1 - d.x0
        .attr('height', function (d) { return layoutData.dy })    // layoutData.dy

      text
        .attr('transform', textTransform)
        .style('display', function (d) {
          return (d.y0 === d.y1 || !nodeVisible(d)) ? 'none' : 'inline'
        })


      //  use this to bring things in the center ( text inside the div -> font size transform etc)
      value
        .style('font-size', function (d) { return Math.min(11,   Math.min(d.x1 - d.x0 - 4, d.y1 - d.y0 - 4)) + 'px' })
        // .style('font-size', function (d) { return 14 + 'px' })
        .attr('transform', function (d) {
          const dx = d.x1 - d.x0
          const dy = d.y1 - d.y0
          // console.log("dx", dx, "dy", dy);
          // const theta = dx > dy ? 0 : -90
          return 'translate(' + (dx / 2) + ',' + ((dy / 2) -  ((d.y1-d.y0) > 2 *Math.min(11,   Math.min(d.x1 - d.x0 - 4, d.y1 - d.y0 - 4)) + 10  ? Math.min(11,   Math.min(d.x1 - d.x0 - 4, d.y1 - d.y0 - 4)) : 0)) + ')'
          // rotate(' + theta + ')'
        })


        value2
        .style('font-size', function (d) { return Math.min(11,  Math.floor(Math.min(d.x1 - d.x0 - 4, d.y1 - d.y0 - 4)) * 0.4) + 'px' })
        .style('display', (d.y1-d.y0) > 2 * Math.min(11,   Math.min(d.x1 - d.x0 - 4, d.y1 - d.y0 - 4)) + 10 ? "display"  : 'none')
        // .style('font-size', function (d) { return 14 + 'px' })
        .attr('transform', function (d) {
          const dx = d.x1 - d.x0
          const dy = d.y1 - d.y0
          // console.log("dx", dx, "dy", dy);
          // const theta = dx > dy ? 0 : -90
          return 'translate(' + (dx / 2) + ',' + ((dy / 2) + (Math.min(11,   Math.min(d.x1 - d.x0 - 4, d.y1 - d.y0 - 4))) ) + ')'
          // rotate(' + theta + ')'
        })
        

      function textTransform(d) {
        const layout = layoutData
        const y = layout.titleAbove ? -10 : (d.y1 - d.y0) / 2
        let x
        if (layout.titleAbove) {
          x = (layout.right ? 4 : -4)
        } else {
          x = (layout.right ? -4 : d.x1 - d.x0 + 4)
        }
        return 'translate(' + x + ',' + y + ')'
      }
    })
  }

  sankeyNode.nodeVisible = function (x) {
    // console.log("nodeVisible-2", x)
    if (arguments.length) {
      nodeVisible = required(x)
      return sankeyNode
    }
    return nodeVisible
  }

  sankeyNode.nodeTitle = function (x) {
    // console.log("nodeTitle-3", x)
    if (arguments.length) {
      nodeTitle = required(x)
      return sankeyNode
    }
    return nodeTitle
  }

  sankeyNode.nodeValue = function (x) {
    // console.log("nodeValue-4", x)
    if (arguments.length) {
      nodeValue = required(x)
      return sankeyNode
    }
    return nodeValue
  }

  sankeyNode.dropoff = function (x) {
    console.log("nodeValue-4", x)
    // if (arguments.length) {
    //   nodeValue = required(x)
    //   return sankeyNode
    // }
    // return nodeValue
    return 20;
  }

  return sankeyNode
}

function nodeTransform(d) {
  // console.log("nodeTransform-5", d)
  return 'translate(' + d.x0 + ',' + d.y0 + ')'
}

function titlePosition(d) {
  // console.log("titlePosition-6", d)
  let titleAbove = false
  let right = false

  // If thin, and there's enough space, put above
  if (d.spaceAbove > 20 && d.style !== 'type') {
    titleAbove = true
  } else {
    titleAbove = false
  }

  if (d.incoming.length === 0) {
    right = true
    titleAbove = false
  } else if (d.outgoing.length === 0) {
    right = false
    titleAbove = false
  }

  return { titleAbove, right }
}

function wrap(d, width) {
  // console.log("wrap-7", d)

  var text = select(this)
  var lines = text.text().split(/\n/)
  var lineHeight = 1.1 // ems
  if (lines.length === 1) return
  text.text(null)
  lines.forEach(function (line, i) {
    text.append('tspan')
      .attr('x', 0)
      .attr('dy', (i === 0 ? 0.7 - lines.length / 2 : 1) * lineHeight + 'em')
      .text(line)
  })
}

function required(f) {
  // console.log("required-8", f)

  if (typeof f !== 'function') throw new Error()
  return f
}
