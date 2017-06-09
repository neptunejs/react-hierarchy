
import {createSelector} from 'reselect';
import flexTree from 'd3-flextree-v4';
import {hierarchy as d3Hierarchy} from 'd3-hierarchy';
import {scaleTime, scaleLinear} from 'd3-scale';
import {
    truncate,
    children as childrenHierarchy,
    minimumChildren
} from './util/hierarchy';

const getData = props => props.data;
const startTime = props => props.startTime;
const endTime = props => props.endTime;
const minChildren = props => props.minimumChildren;

export const treeSelector = createSelector([
    getData, startTime, endTime, minChildren
], (data, startTime, endTime, minChildren) => {
    let root = data;
    if (minChildren) {
        root = minimumChildren(root, minChildren);
    }
    if (endTime) {
        endTime = new Date(endTime).getTime();
        root = truncate(root, node => node.data.time > endTime);
    }


    if (startTime) {
        startTime = new Date(startTime).getTime();
        let children = childrenHierarchy(root, node => node.data.time > startTime, {depth: 'first'});
        root = d3Hierarchy({
            data: {
                name: 'start node',
                time: startTime,
                fakeRoot: true
            },
            children: children
        });

        // Normalize the hierarchy, since it was built from Node instances
        root.eachBefore(node => node.data = node.data.data);
    }

    const processed = processData(root);
    return {root, processed};
});

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

function processData(data) {
    const {root, leaf} = getRootAndLeaf(data);
    // const rootTime = root.data.time;

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
        return a.maxTime > b.maxTime ? -1 : 1;
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
        node.realY = scaleX(node.x);
        node.realX = scale(node.data.time);
    });


    return {root, leaf};
}
