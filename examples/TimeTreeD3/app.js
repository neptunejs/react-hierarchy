import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import createData from '../../tools/createData';
import TimeTreeD3 from '../../src/components/TimeTreeD3';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const initialValue = 0;

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: String(initialValue),
            data: createData(initialValue),
            startDate: '',
            endDate: ''
        };
    }

    render() {
        return (
            <div>
                <TimeTreeD3
                    startTime={this.state.startDate ? this.state.startDate.unix() * 1000 : this.state.startDate}
                    endTime={this.state.endDate ? this.state.endDate.unix() * 1000 : this.state.endDate}
                    data={this.state.data}
                    width={800}
                    height={880}
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
            </div>
        );
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

ReactDOM.render(
    <App />
    ,
    document.getElementById('example')
);
