import React, {Component} from 'react';
import {TimeAxis} from 'react-axis';
import {scaleTime, scaleLinear} from 'd3-scale';
import {select} from 'd3-selection';
import 'd3-transition';
import flexTree from 'd3-flextree-v4';
import {hierarchy as d3Hierarchy} from 'd3-hierarchy';
import ReactDOM from 'react-dom';

import {
    truncate,
    children as childrenHierarchy,
    NODE_TYPES,
    getNodeType,
    minimumChildren
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
        this.shouldCreateTree = true;
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

        const d3Links = select(svg).select('.links')
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


        const gCircle = select(svg).select('.nodes')
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
            .on('click', this.props.onNodeClick);


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
        const props = ['data', 'startTime', 'endTime', 'minimumChildren'];
        this.shouldCreateTree = props.some(p => {
            const r = nextProps[p] !== this.props[p];
            if(r) console.log('prop that changed', p);
            return r;
        });
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

        if (root.ancestors().slice(1).findIndex(ancestor => ancestor.data === previousRoot.data) > -1) return RENDER_CHILD_DATA;
        if (previousRoot.ancestors().findIndex(ancestor => ancestor.data === root.data) > -1) return RENDER_PARENT_DATA;
        return RENDER_NEW_DATA;
    }

    updateTree() {
        if (this.shouldCreateTree || this.previousRoot !== this.root) {
            if (this.props.minimumChildren) {
                this.root = minimumChildren(this.root, this.props.minimumChildren);
            }
            if (this.props.endTime) {
                this.root = truncate(this.root, node => node.data.time > this.props.endTime);
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
        }
    }


    render() {
        const {width, height} = this.props;
        let {data} = this.props;

        this.previousRoot = this.root;
        this.root = data;
        this.updateTree();

        const beginTimeScale = this.root.data.time;
        const endTimeScale = this.processed.leaf.data.time;

        return (
            <svg width={width} height={height} viewBox="0 0 1000 1100"
                 xmlns="http://www.w3.org/2000/svg" style={{overflow: 'visible'}}>
                <svg x="0" y="25" width="1000" height="1000"
                     viewBox="0 0 1000 1000" style={{overflow: 'visible'}} ref="svgTree">
                    <g className="links" />
                    <g className="nodes" />
                </svg>
                <svg x="0" y="1050" width="1000" height="50" viewBox="0 0 1000 50">
                    <TimeAxis position="bottom" beginTime={beginTimeScale}
                              endTime={endTimeScale}
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


const defaultNodeRenderer = () => <circle r="4"/>;

TimeTreeD3.defaultProps = {
    nodeRenderer: defaultNodeRenderer
};


export default TimeTreeD3;
