import React, { Component } from 'react';
// import { TimeAxis } from 'react-axis';
import { select } from 'd3-selection';
import 'd3-transition';
import ReactDOM from 'react-dom';
import { treeSelector } from './selector';

import {
  NODE_TYPES,
  getNodeType
} from './util/hierarchy';

class Hierarchy extends Component {
  constructor(props) {
    super(props);
    this.previousRoot = null;
    this.root = null;
  }

  componentDidMount() {
    this.buildNodeIndex(this.props.data);
    this.d3Render();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.data !== nextProps.data) this.buildNodeIndex(nextProps.data);
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.nodeRenderer !== nextProps.nodeRenderer ||
            this.props.rootRenderer !== nextProps.rootRenderer ||
            this.props.leafRenderer !== nextProps.leafRenderer ||
            this.props.onNodeClick !== nextProps.onNodeClick ||
            this.props.transition !== nextProps.transition ||
            this.props.width !== nextProps.width ||
            this.props.height !== nextProps.height ||
            treeSelector(nextProps) !== this.computedTree
    );
  }

  componentDidUpdate() {
    this.d3Render();
  }

  d3Render() {
    const { transition } = this.props;
    const root = this.root;


    const svg = this.refs.svgTree;

    const nodes = [];
    const links = [];
    root.each((node) => {
      nodes.push(node);
      if (node !== root && node.parent) {
        links.push(node);
      }
    });

    const that = this;

    const updateCircle = (el) => {
      return el.select(function (d) {
        let Renderer = that.props.nodeRenderer;
        const nodeType = getNodeType(d);
        switch (nodeType) {
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
      }).attr('transform', (d) => {
        return `translate(${d.realX}, ${d.realY})`;
      });
    };


    const updateLine1 = (el) => {
      return el
        .attr('x1', (node) => node.parent.realX)
        .attr('y1', (node) => node.parent.realY)
        .attr('x2', (node) => node.parent.realX)
        .attr('y2', (node) => node.realY);
    };

    const updateLine2 = (el) => {
      return el
        .attr('x1', (node) => node.parent.realX)
        .attr('y1', (node) => node.realY)
        .attr('x2', (node) => node.realX)
        .attr('y2', (node) => node.realY);
    };

    const d3Links = select(svg).select('.links')
      .selectAll('g.link')
      .data(links, (link) => link.data.name);

    // Update
    updateLine1(d3Links.select('line:nth-child(1)').transition().duration(transition.update.wait).transition().duration(transition.update.duration));
    updateLine2(d3Links.select('line:nth-child(2)').transition().duration(transition.update.wait).transition().duration(transition.update.duration));

    // New
    const gLink = d3Links.enter()
      .append('g')
      .attr('class', 'link')
      .attr('stroke', 'black')
      .attr('stroke-opacity', 0);

    gLink.transition().duration(transition.enter.wait)
      .transition().duration(transition.enter.duration)
      .attr('stroke-opacity', 1);

    updateLine1(gLink.append('line'));
    updateLine2(gLink.append('line'));

    // Remove
    d3Links.exit()
      .transition().duration(transition.exit.wait)
      .transition().duration(transition.exit.duration)
      .attr('stroke-opacity', 0)
      .remove();


    const gCircle = select(svg).select('.nodes')
      .selectAll('g.node')
      .data(nodes, (node) => node.data.name);


    // Update node
    updateCircle(gCircle.select('g').transition().duration(transition.update.wait).transition().duration(transition.update.duration));
    // New node
    let circles = gCircle.enter()
      .append('g')
      .attr('class', 'node');

    // Node transition
    circles.attr('opacity', 0).transition().duration(transition.enter.wait).transition().duration(transition.enter.duration)
      .attr('opacity', 1);


    circles = circles.append('g')
      .on('click', this.props.onNodeClick);


    updateCircle(circles);


    // Remove
    gCircle.exit()
      .transition().duration(transition.exit.wait)
      .transition().duration(transition.exit.duration)
      .attr('opacity', 0).remove();

  }

  buildNodeIndex(data) {
    this.nodeIndex = new Map();
    data.each((node) => {
      if (node.data.name) {
        this.nodeIndex.set(node.data.name, node);
      }
    });
  }

  render() {
    const { width, height } = this.props;
    this.previousRoot = this.root;
    this.computedTree = treeSelector(this.props);
    this.root = this.computedTree.root;
    this.processed = this.computedTree.processed;

    // const beginTimeScale = this.root.data.time;
    // const endTimeScale = this.processed.leaf.data.time;

    return (
      <svg width={width}
        height={height}
        viewBox="0 0 1000 1100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <svg x="0"
          y="25"
          width="1000"
          height="1000"
          viewBox="0 0 1000 1000"
          style={{ overflow: 'visible' }}
          ref="svgTree"
        >
          <g className="links" />
          <g className="nodes" />
        </svg>
        <svg x="0" y="1050" width="1000" height="50" viewBox="0 0 1000 50">
          {/* <TimeAxis position="bottom"
            beginTime={beginTimeScale}
            endTime={endTimeScale}
            width={1000}
            height={50}
          /> */}
        </svg>
      </svg>
    );
  }
}

Hierarchy.defaultProps = {
  // eslint-disable-next-line react/no-multi-comp
  nodeRenderer: () => <circle r="4" />,
  transition: {
    enter: {
      wait: 0,
      duration: 0
    },
    update: {
      wait: 0,
      duration: 0
    },
    exit: {
      wait: 0, duration: 0
    }
  }
};


export default Hierarchy;
