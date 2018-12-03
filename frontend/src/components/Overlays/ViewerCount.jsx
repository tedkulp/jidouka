import * as React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { get } from 'lodash';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitch } from '@fortawesome/free-brands-svg-icons'

import './ViewerCount.scss';

class ViewerCount extends React.Component {
    render() {
        const { status } = this.props;
        const showDiv = get(status, 'numViewers', 0) > 0;

        const classes = classNames('viewercount-wrapper', {
            'fade-in': showDiv,
            'fade-out': !showDiv,
        });

        return (
            <React.Fragment>
                <div className={classes}>
                    <FontAwesomeIcon className="icon" icon={faTwitch} />
                    <span className="count">{status.numViewers}</span>
                </div>
            </React.Fragment>
        );
    }
}

const mapStateToProps = state => {
    return {
        status: state.status,
    };
};

export default connect(mapStateToProps)(ViewerCount);
