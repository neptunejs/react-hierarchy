import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import createData from '../../tools/createData';
import TimeTreeD3 from '../../src/components/TimeTreeD3';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PieChart from './PieChart';

const ENTER_EXIT_DURATION = 400;
const UPDATE_DURATION = 700;

var slices = [
    {color: '#468966', value: 10},
    {color: '#FFF0A5', value: 20},
    {color: '#FFB03B', value: 30},
    {color: '#B64926', value: 40},
    {color: '#8E2800', value: 50},
];

const initialValue = 0;

const nodeLabelRenderer = props => {
    return (
        <g>
            <circle r="4"/>
            <text x="5" y="0" transform="rotate(-45)">{props.data.data.name}</text>
        </g>
    );
};

const simpleRenderer = () => <circle r="4"/>;

const nodePieChartRenderer = props => {
    return (
        <g>
            <PieChart size={20} slices={slices}/>
        </g>
    )
};

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: String(initialValue),
            data: createData(initialValue),
            startDate: null,
            endDate: null,
            minimumChildren: 0,
            hovered: null
        };
    }

    render() {

        const HoverRenderer = (BaseRenderer) => {
            return (props) => {
                return (
                    <g
                        onMouseEnter={() => this.setState({hovered: props.data})}
                        onMouseLeave={() => this.setState({hovered: null})}
                    >
                        <BaseRenderer {...props} />
                    </g>
                );
            }
        };

        return (
            <div onDoubleClick={() => this.setState({
                data: createData(parseInt(this.state.value)),
                transition: {
                    enter: {wait: UPDATE_DURATION, duration: ENTER_EXIT_DURATION},
                    update: {wait: 0, duration: UPDATE_DURATION},
                    exit: {wait: 0, duration: 0}
                }
            })}>
                <TimeTreeD3
                    onNodeClick={node => this.setState({
                        data: node,
                        transition: {
                            enter: {wait: UPDATE_DURATION + ENTER_EXIT_DURATION, duration: 0},
                            update: {wait: ENTER_EXIT_DURATION, duration: UPDATE_DURATION},
                            exit: {wait: 0, duration: ENTER_EXIT_DURATION}
                        }
                    })}
                    nodeRenderer={HoverRenderer(nodePieChartRenderer)}
                    rootRenderer={HoverRenderer(simpleRenderer)}
                    leafRenderer={HoverRenderer(nodeLabelRenderer)}
                    startTime={this.state.startDate ? this.state.startDate.unix() * 1000 : null}
                    endTime={this.state.endDate ? this.state.endDate.unix() * 1000 : null}
                    data={this.state.data}
                    width={800}
                    height={880}
                    minimumChildren={this.state.minimumChildren}
                    transition={this.state.transition}
                />
                <br/>
                <input type="text" value={this.state.value} onChange={(e) => this.changeValue(e.target.value)}/>
                <DatePicker
                    selected={this.state.startDate}
                    onChange={this.changeStartDate.bind(this)}
                />
                <DatePicker
                    selected={this.state.endDate}
                    onChange={this.changeEndDate.bind(this)}
                />
                <br/>
                Minimum children: <input type="text" value={this.state.minimumChildren} onChange={(e) => this.changeMinimumChildren(e.target.value)} />
                <div>
                    <div>
                        {renderInfo(this.state.hovered)}
                    </div>
                </div>
            </div>
        );
    }

    changeMinimumChildren(value) {
        this.setState({
            minimumChildren: Number(value) || 0
        });
    }

    changeStartDate(value) {
        this.setState({
            startDate: value
        })
    }

    changeEndDate(value) {
        this.setState({
            endDate: value
        })
    }

    changeValue(value) {
        var intValue = parseInt(value);
        if (!isNaN(intValue)) {
            this.setState({
                value,
                data: createData(intValue)
            });
        } else {
            this.setState({
                value
            });
        }
    }
}

function renderInfo(node) {
    if (node) {
        return (
            <h2>
                Hovered node: {node.data.name}
            </h2>
        );
    }
}

ReactDOM.render(
    <App />
    ,
    document.getElementById('example')
);
