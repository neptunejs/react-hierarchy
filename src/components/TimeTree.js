import React from 'react';
import {TimeAxis} from 'react-axis';
import {scaleTime, scaleLinear} from 'd3-scale';
import flexTree from 'd3-flextree-v4';

export default function TimeTree({width, height, data}) {
    const {root, leaf} = getRootAndLeaf(data);
    const rootTime = root.data.time;

    const tree = flexTree()
        .size([1000, 1000])
        .separation(() => 1)
        .nodeSize(function (node) {
            if (!node.parent) return [1, 0];
            return [1, (node.data.time - node.parent.data.time) / 10000000];
        });

    data.each(function (node) {
        var leaves = node.leaves();
        var max = -Infinity;
        for (var leaf of leaves) {
            if (leaf.data.time > max) max = leaf.data.time;
        }
        node.maxTime = max;
    });

    data.sort(function (a, b) {
        // return a.data.time > b.data.time ? -1 : 1
        return a.maxTime > b.maxTime ? -1 : 1
    });

    tree(data);

    var minx = Infinity;
    var miny = Infinity;
    var maxx = -Infinity;
    var maxy = -Infinity;
    data.each((node) => {
        if (node.x > maxx) maxx = node.x;
        if (node.x < minx) minx = node.x;
        if (node.y > maxy) maxy = node.y;
        if (node.y < miny) miny = node.y;
    });

    const beginTime = root.data.time;
    const endTime = leaf.data.time;

    const scaleX = scaleLinear()
        .domain([minx, maxx])
        .range([0, 1000]);

    const scale = scaleTime()
        .domain([beginTime, endTime])
        .range([0, 1000]);

    root.each((node) => {
        node.y = scaleX(node.x);//node.x;
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
            <svg x="0" y="25" width="1000" height="1000"
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
