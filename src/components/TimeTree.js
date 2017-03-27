import React from 'react';
import {TimeAxis} from 'react-axis';
import {scaleTime} from 'd3-scale';

export default function TimeTree({width, height, data}) {
    const {root, leaf} = addY(data);
    const beginTime = root.data.time;
    const endTime = leaf.data.time;

    const scale = scaleTime()
        .domain([beginTime, endTime])
        .range([0, 1000]);

    root.each((node) => {
        node.x = scale(node.data.time);
        node.y = node.y * 100
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
                 viewBox="0 -500 1000 1000" style={{overflow: 'visible'}}>
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

function addY(data, yValue = 0) {
    const root = data;
    const leaves = data.leaves();
    let mostRecentLeave = null;
    let mostRecentDate = 0;
    for (const leave of leaves) {
        if (leave.data.time > mostRecentDate) {
            mostRecentDate = leave.data.time;
            mostRecentLeave = leave;
        }
    }
    const path = root.path(mostRecentLeave);
    path.forEach((node, index) => {
        node.y = yValue;
        let newY = yValue;
        if (node.children) {
            for (const child of node.children) {
                if (child !== path[index + 1]) {
                    newY = increment(newY);
                    addY(child, newY);
                }
            }
        }
    });
    return {root, leaf: mostRecentLeave};
}

function increment(y) {
    switch (Math.sign(y)) {
        case 1:
            return -y;
        case -1:
            return -y + 1;
        case 0:
            return y + 1;
    }
}
