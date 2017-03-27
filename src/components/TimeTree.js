import React from 'react';
import {TimeAxis} from 'react-axis';
import {scaleTime} from 'd3-scale';
import {tree as d3Tree} from 'd3-hierarchy'

export default function TimeTree({width, height, data}) {
    const {root, leaf} = getRootAndLeaf(data);

    const tree = d3Tree()
        .size([1000, 1000])
        .separation(() => 1);

    tree(data);

    const beginTime = root.data.time;
    const endTime = leaf.data.time;

    const scale = scaleTime()
        .domain([beginTime, endTime])
        .range([0, 1000]);

    root.each((node) => {
        node.y = node.x;
        node.x = scale(node.data.time);
    });

    function getElements(root) {
        const circles = [];
        const lines = [];
        root.each((node) => {
            circles.push(<circle key={node.data.name} cx={node.x} cy={node.y} r="3" />);
            if (node.parent) { // root node does not need a line
                lines.push(makeLine(node))
            }
        });
        return {circles, lines};
    }

    function makeLine(node) {
        return (
            <g key={node.data.name} stroke="black">
                <line x1={node.parent.x} y1={node.parent.y} x2={node.parent.x} y2={node.y} />
                <line x1={node.parent.x} y1={node.y} x2={node.x} y2={node.y} />
            </g>
        )
    }

    const {circles, lines} = getElements(root);

    return (
        <svg width={width} height={height} viewBox="0 0 1000 1100"
             xmlns="http://www.w3.org/2000/svg" style={{overflow: 'visible'}}>
            <svg x="0" y="50" width="1000" height="1000"
                 viewBox="0 0 1000 1000" style={{overflow: 'visible'}}>
                <g>
                    {circles}
                </g>
                <g>
                    {lines}
                </g>
            </svg>
            <svg x="0" y="1050" width="1000" height="50" viewBox="0 0 1000 50">
                <TimeAxis position="bottom" beginTime={beginTime}
                          endTime={endTime}
                          width={1000} height={50}/>
            </svg>
        </svg>
    );
}

function getRootAndLeaf(data) {
    const root = data;
    const leaves = data.leaves();
    let mostRecentLeaf = null;
    let mostRecentDate = 0;
    for (const leave of leaves) {
        if (leave.data.time > mostRecentDate) {
            mostRecentDate = leave.data.time;
            mostRecentLeaf = leave;
        }
    }
    return {root, leaf: mostRecentLeaf};
}
