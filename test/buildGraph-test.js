import { buildGraph } from "../src/util.js";
import tape from "tape";

function defaultNodeId(d) {
  return d.id;
}

function defaultNodeBackwards(d) {
  return d.direction && d.direction.toLowerCase() === "l";
}

function defaultSourceId(d) {
  return {
    id: typeof d.source === "object" ? d.source.id : d.source,
    port: typeof d.sourcePort === "object" ? d.sourcePort.id : d.sourcePort,
  };
}

function defaultTargetId(d) {
  return {
    id: typeof d.target === "object" ? d.target.id : d.target,
    port: typeof d.targetPort === "object" ? d.targetPort.id : d.targetPort,
  };
}

function defaultLinkType(d) {
  return d.type;
}

function defaultLinkValue(d) {
  return d.value;
}

tape('buildGraph() adds dummy nodes for "from_elsewhere" links', (test) => {
  var graph = {
    nodes: [
      { id: "a" },
      { id: "b", from_elsewhere: [{ type: "x", value: 1.0 }] },
    ],
    links: [{ source: "a", target: "b", type: "x", value: 2.0 }],
  };

  const G = buildGraph(
    graph,
    defaultNodeId,
    defaultNodeBackwards,
    defaultSourceId,
    defaultTargetId,
    defaultLinkType,
    defaultLinkValue
  );

    // order doesn't matter, so should really test unsorted
    test.deepEqual(G.edges(), [
        {v: "__from_elsewhere_b", w: "b", name: "x"},
        {v: "a", w: "b", name: "x"},
    ])

  test.end();
});
