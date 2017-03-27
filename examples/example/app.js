import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import createData from '../../tools/createData';
import {TimeTree} from '../../src';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: createData(50)
        };
    }

    render() {
        return (
            <div>
                <TimeTree data={this.state.data} width={800} height={880} />
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('example')
);
