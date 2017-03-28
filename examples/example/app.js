import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import createData from '../../tools/createData';
import {TimeTree} from '../../src';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '0',
            data: createData(0)
        };
    }

    render() {
        return (
            <div>
                <input type="text" value={this.state.value} onChange={(e) => this.changeValue(e.target.value)} />
                <TimeTree data={this.state.data} width={800} height={880} />
            </div>
        );
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
    <App />,
    document.getElementById('example')
);
