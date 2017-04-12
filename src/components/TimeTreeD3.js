import React, {Component} from 'react';
import {TimeAxis} from 'react-axis';
import {scaleTime, scaleLinear} from 'd3-scale';
import {select} from 'd3-selection';
import 'd3-transition';
import flexTree from 'd3-flextree-v4';
import {hierarchy as d3Hierarchy} from 'd3-hierarchy';
import ReactDOM from 'react-dom';

import {
    untruncate,
    truncate,
    children as childrenHierarchy,
    NODE_TYPES,
    getNodeType
} from '../util/hierarchy';

const UPDATE_TRANSITION_DURATION = 1000;
const ENTER_EXIT_TRANSITION_DURATION = 500;

const RENDER_NEW_DATA = 'RENDER_NEW_DATA';
const RENDER_CHILD_DATA = 'RENDER_CHILD_DATA';
const RENDER_PARENT_DATA = 'RENDER_PARENT_DATA';

class TimeTreeD3 extends Component {
    constructor(props) {
        super(props);
        this.previousRoot = null;
        this.root = null;
        this.state = {
            clickedNode: null
        };
    }

    d3Render(renderType) {
        let updateTransitionWait, enterExitTransitionWait;
        let updateTransitionDuration = UPDATE_TRANSITION_DURATION;
        let enterExitTransitionDuration = ENTER_EXIT_TRANSITION_DURATION;
        if (renderType === RENDER_PARENT_DATA) {
            updateTransitionWait = 0;
            enterExitTransitionWait = UPDATE_TRANSITION_DURATION;
        } else if (renderType === RENDER_CHILD_DATA) {
            updateTransitionWait = ENTER_EXIT_TRANSITION_DURATION;
            enterExitTransitionWait = 0;
        } else {
            updateTransitionWait = 0;
            enterExitTransitionWait = 0;
            updateTransitionDuration = 0;
            enterExitTransitionDuration = 0;
        }
        const {root, leaf, minx, maxx} = this.processed;

        const beginTime = root.data.time;
        const endTime = leaf.data.time;

        const scaleX = scaleLinear()
            .domain([minx, maxx])
            .range([0, 1000]);

        const scale = scaleTime()
            .domain([beginTime, endTime])
            .range([0, 1000]);

        root.each((node) => {
            // node.y = scaleX(node.x);//node.x;
            node.realY = scaleX(node.x);
            node.realX = scale(node.data.time);
            // node.x = scale(node.data.time);
        });

        const svg = this.refs.svgTree;

        select(svg).append('g').attr('id', 'links');
        select(svg).append('g').attr('id', 'nodes');

        const nodes = [];
        const links = [];
        root.each(node => {
            nodes.push(node);
            if (node !== root && node.parent) {
                links.push(node);
            }
        });

        const that = this;

        const updateCircle = el => {
            return el.select(function (d) {
                let Renderer = that.props.nodeRenderer;
                const nodeType = getNodeType(d);
                switch(nodeType) {
                    case NODE_TYPES.ROOT:
                    case NODE_TYPES.FAKE_ROOT:
                        Renderer = that.props.rootRenderer || Renderer;
                        break;
                    case NODE_TYPES.LEAF:
                        Renderer = that.props.leafRenderer || Renderer;
                        break;
                    default:
                        // Keep default renderer for intermediate node
                        break;
                }

                ReactDOM.render(<Renderer data={d} />, this);
                return this;
            }).attr('transform', d => {
                return `translate(${d.realX}, ${d.realY})`;
            });
        };


        const updateLine1 = el => {
            return el
                .attr('x1', node => node.parent.realX)
                .attr('y1', node => node.parent.realY)
                .attr('x2', node => node.parent.realX)
                .attr('y2', node => node.realY);
        };

        const updateLine2 = el => {
            return el
                .attr('x1', node => node.parent.realX)
                .attr('y1', node => node.realY)
                .attr('x2', node => node.realX)
                .attr('y2', node => node.realY);
        };

        const d3Links = select(svg).select('#links')
            .selectAll('g.link')
            .data(links, link => link.data.name);

        // Update
        updateLine1(d3Links.select('line:nth-child(1)').transition().duration(updateTransitionWait).transition().duration(updateTransitionDuration));
        updateLine2(d3Links.select('line:nth-child(2)').transition().duration(updateTransitionWait).transition().duration(updateTransitionDuration));

        // New
        const gLink = d3Links.enter()
            .append('g')
            .attr('class', 'link')
            .attr('stroke', 'black')
            .attr('stroke-opacity', 0);

        gLink.transition().duration(enterExitTransitionWait)
            .transition().duration(enterExitTransitionDuration)
            .attr('stroke-opacity', 1);

        updateLine1(gLink.append('line'));
        updateLine2(gLink.append('line'));

        // Remove
        d3Links.exit()
            .transition().duration(enterExitTransitionWait)
            .transition().duration(enterExitTransitionDuration)
            .attr('stroke-opacity', 0)
            .remove();


        const gCircle = select(svg).select('#nodes')
            .selectAll('g.node')
            .data(nodes, node => node.data.name);


        // Update node
        updateCircle(gCircle.select('g').transition().duration(updateTransitionWait).transition().duration(updateTransitionDuration));
        // New node
        let circles = gCircle.enter()
            .append('g')
            .attr('class', 'node');

        // Node transition
        circles.attr('opacity', 0).transition().duration(enterExitTransitionWait).transition().duration(enterExitTransitionDuration)
            .attr('opacity', 1);


        circles = circles.append('g')
            .on('click', d => {
                this.setState({
                    clickedNode: d
                });
            });


        updateCircle(circles);


        // Remove
        gCircle.exit()
            .transition().duration(enterExitTransitionWait)
            .transition().duration(enterExitTransitionDuration)
            .attr('opacity', 0).remove();

    }

    buildNodeIndex(data) {
        this.nodeIndex = new Map();
        data.each(node => {
            if (node.data.name) {
                this.nodeIndex.set(node.data.name, node);
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.data !== nextProps.data) this.buildNodeIndex(nextProps.data);
    }

    componentDidMount() {
        this.buildNodeIndex(this.props.data);
        this.d3Render(RENDER_NEW_DATA);
    }

    componentDidUpdate() {
        this.d3Render(this.getRenderType());
    }

    getRenderType() {
        if (!this.previousRoot) return RENDER_NEW_DATA;
        const root = this.nodeIndex.get(this.root.data.name);
        const previousRoot = this.nodeIndex.get(this.previousRoot.data.name);

        if (!root || !previousRoot) return RENDER_NEW_DATA;

        if (root.ancestors().slice(1).indexOf(previousRoot) > -1) return RENDER_CHILD_DATA;
        if (previousRoot.ancestors().indexOf(root) > -1) return RENDER_PARENT_DATA;
        return RENDER_NEW_DATA;
    }


    render() {
        const {width, height, data} = this.props;
        this.previousRoot = this.root;
        this.root = findRootNode(data, this.state.clickedNode);
        untruncate(this.previousRoot);
        if (this.props.endTime) {
            truncate(this.root, node => node.data.time > this.props.endTime);
        }


        if (this.props.startTime) {
            let children = childrenHierarchy(this.root, node => node.data.time > this.props.startTime, {depth: 'first'});
            this.root = d3Hierarchy({
                data: {
                    name: 'start node',
                    time: this.props.startTime,
                    fakeRoot: true
                },
                children: children
            });

            // Normalize the hierarchy, since it was built from Node instances
            this.root.eachBefore(node => node.data = node.data.data);
        }

        this.processed = processData(this.root);


        const beginTime = this.root.data.time;
        const endTime = this.processed.leaf.data.time;

        return (
            <svg width={width} height={height} viewBox="0 0 1000 1100"
                 onDoubleClick={() => this.setState({
                     clickedNode: this.props.data
                 })}
                 xmlns="http://www.w3.org/2000/svg" style={{overflow: 'visible'}}>
                <svg x="0" y="25" width="1000" height="1000"
                     viewBox="0 0 1000 1000" style={{overflow: 'visible'}} ref="svgTree">
                </svg>
                <svg x="0" y="1050" width="1000" height="50" viewBox="0 0 1000 50">
                    <TimeAxis position="bottom" beginTime={beginTime}
                              endTime={endTime}
                              width={1000} height={50}
                    />
                </svg>
            </svg>
        );
    }
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

    return {root, leaf, minx, maxx, miny, maxy};
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

function findRootNode(data, clickedNode) {
    if (clickedNode === null) return data;
    let found = false;
    data.each(node => {
        if (node.data === clickedNode.data) found = true;
    });
    if (found) return clickedNode;
    return data;
}

const defaultNodeRenderer = () => <circle r="4"/>;

TimeTreeD3.defaultProps = {
    nodeRenderer: defaultNodeRenderer
};


export default TimeTreeD3;
