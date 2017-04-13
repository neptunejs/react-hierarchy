// Adapted from https://github.com/brigade/react-simple-pie-chart

/*
The MIT License (MIT)

Copyright (c) 2015 Brigade

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import React from 'react';
const {PropTypes} = React;

/**
 * @param {Object[]} slices
 * @return {Object[]}
 */
function renderPaths(slices, options) {
    const total = slices.reduce((totalValue, {value}) => totalValue + value, 0);

    let radSegment = 0;
    let lastX = options.radius;
    let lastY = 0;

    return slices.map(({color, value}, index) => {
        // Should we just draw a circle?
        if (value === total) {
            return (
                <circle
                    r={options.radius}
                    cx={options.center}
                    cy={options.center}
                    fill={color}
                    key={index}
                />
            );
        }

        if (value === 0) {
            return;
        }

        const valuePercentage = value / total;

        // Should the arc go the long way round?
        const longArc = (valuePercentage <= 0.5) ? 0 : 1;

        radSegment += valuePercentage * options.radCircumference;
        const nextX = Math.cos(radSegment) * options.radius;
        const nextY = Math.sin(radSegment) * options.radius;

        // d is a string that describes the path of the slice.
        // The weirdly placed minus signs [eg, (-(lastY))] are due to the fact
        // that our calculations are for a graph with positive Y values going up,
        // but on the screen positive Y values go down.
        const d = [
            `M ${options.center},${options.center}`,
            `l ${lastX},${-lastY}`,
            `a${options.radius},${options.radius}`,
            '0',
            `${longArc},0`,
            `${nextX - lastX},${-(nextY - lastY)}`,
            'z',
        ].join(' ');

        lastX = nextX;
        lastY = nextY;

        return <path d={d} fill={color} key={index}/>;
    });
}

/**
 * Generates an SVG pie chart.
 * @see {http://wiki.scribus.net/canvas/Making_a_Pie_Chart}
 */
export default class PieChart extends React.Component {
    /**
     * @return {Object}
     */
    render() {
        const size = this.props.size;
        const options = {
            radCircumference: Math.PI * 2,
            center: Math.floor(size / 2),
            radius: Math.floor(size / 2) -1
        };
        return (
            <g transform={`translate(${-options.center},${-options.center}) rotate(-90 ${options.center} ${options.center})`}>
                {renderPaths(this.props.slices, options)}
            </g>
        );
    }
}

PieChart.defaultProps = {
    size: 20
}

PieChart.propTypes = {
    slices: PropTypes.arrayOf(PropTypes.shape({
        color: PropTypes.string.isRequired, // hex color
        value: PropTypes.number.isRequired,
    })).isRequired,
};