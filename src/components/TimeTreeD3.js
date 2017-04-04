import React, {Component} from 'react';
import {TimeAxis} from 'react-axis';
import {scaleTime, scaleLinear} from 'd3-scale';
import {select} from 'd3-selection';
import 'd3-transition';
import flexTree from 'd3-flextree-v4';

const UPDATE_TRANSITION_DURATION = 1000;
const ENTER_EXIT_TRANSITION_DURATION = 500;

class TimeTreeD3 extends Component {
    d3Render() {


        const update = (rootNode, isChild) => {
            var updateTransitionWait, enterExitTransitionWait;
            if (isChild) {
                updateTransitionWait = ENTER_EXIT_TRANSITION_DURATION;
                enterExitTransitionWait = 0;
            } else {
                updateTransitionWait = 0;
                enterExitTransitionWait = UPDATE_TRANSITION_DURATION;
            }
            this.init(rootNode);

            const leaf = this.leaf;
            const root = this.root;
            const beginTime = root.data.time;
            const endTime = leaf.data.time;

            const scaleX = scaleLinear()
                .domain([this.minx, this.maxx])
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
            rootNode.each(node => {
                nodes.push(node);
                if (node !== rootNode && node.parent) {
                    links.push(node);
                }
            });

            const updateCircle = el => {
                return el
                    .attr('cx', node => node.realX)
                    .attr('cy', node => node.realY)
                    .attr('r', 5);
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

            const d3Links = select(svg)
                .selectAll('g.link')
                .data(links, link => link.data.name);

            // Update
            updateLine1(d3Links.select('line:nth-child(1)').transition().duration(updateTransitionWait).transition().duration(UPDATE_TRANSITION_DURATION));
            updateLine2(d3Links.select('line:nth-child(2)').transition().duration(updateTransitionWait).transition().duration(UPDATE_TRANSITION_DURATION));

            // New
            const gLink = d3Links.enter()
                .append('g')
                .attr('class', 'link')
                .attr('stroke', 'black')
                .attr('stroke-opacity', 0);

            gLink.transition().duration(enterExitTransitionWait)
                .transition().duration(ENTER_EXIT_TRANSITION_DURATION)
                .attr('stroke-opacity', 1);

            updateLine1(gLink.append('line'));
            updateLine2(gLink.append('line'));

            // Remove
            d3Links.exit()
                .transition().duration(enterExitTransitionWait)
                .transition().duration(ENTER_EXIT_TRANSITION_DURATION)
                .attr('stroke-opacity', 0)
                .remove();


            const gCircle = select(svg)
                .selectAll('g.node')
                .data(nodes, node => node.data.name);

            // Update node
            updateCircle(gCircle.select('circle').transition().duration(updateTransitionWait).transition().duration(UPDATE_TRANSITION_DURATION));


            // New node
            let circles = gCircle.enter()
                .append('g')
                .attr('class', 'node')
                .attr('fill-opacity', 0);


            circles.transition().duration(enterExitTransitionWait).transition().duration(ENTER_EXIT_TRANSITION_DURATION)
                .attr('fill-opacity', 1);


            circles = circles.append('circle')
                .on('click', d => {
                    update(d, true);
                });


            updateCircle(circles);


            // Remove
            gCircle.exit()
                .transition().duration(enterExitTransitionWait)
                .transition().duration(ENTER_EXIT_TRANSITION_DURATION)
                .attr('fill-opacity', 0).remove();
        };

        update(this.root);
    }

    componentDidMount() {
        this.d3Render();
    }

    componentDidUpdate() {
        this.d3Render();
    }

    init(data) {
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

        this.root = root;
        this.leaf = leaf;
        this.minx = minx;
        this.maxx = maxx;
        this.miny = miny;
        this.maxy = maxy;

    }

    render() {
        const {width, height, data} = this.props;
        this.init(data);
        const beginTime = this.root.data.time;
        const endTime = this.leaf.data.time;

        return (
            <svg width={width} height={height} viewBox="0 0 1000 1100"
                 xmlns="http://www.w3.org/2000/svg" style={{overflow: 'visible'}}>
                <svg x="0" y="25" width="1000" height="1000"
                     viewBox="0 0 1000 1000" style={{overflow: 'visible'}} ref="svgTree">
                </svg>
                <svg x="0" y="1050" width="1000" height="50" viewBox="0 0 1000 50">
                    <TimeAxis position="bottom" beginTime={beginTime}
                              endTime={endTime}
                              width={1000} height={50}/>
                </svg>
            </svg>
        );
    }
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

export default TimeTreeD3;
