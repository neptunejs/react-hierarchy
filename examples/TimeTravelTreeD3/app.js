import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import {TimeTreeD3} from '../../src/index';

import getData from '../../src/getData';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: null
        };
        getData().then((data) => {
            this.setState({data});
        });
    }

    render() {
        return (
            <div>
                {this.state.data ? <TimeTreeD3 data={this.state.data} width={800} height={1880} /> : ''}
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('example')
);
