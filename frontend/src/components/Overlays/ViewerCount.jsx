import * as React from 'react';
import { connect } from 'react-redux';
import { Transition, config } from 'react-spring';
import { get } from 'lodash';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitch } from '@fortawesome/free-brands-svg-icons'

import './ViewerCount.scss';

class ViewerCount extends React.Component {
    render() {
        const { status } = this.props;
        const showDiv = get(status, 'numViewers', 0) > 0;

        return (
            <React.Fragment>
                <Transition
                    config={config.slow}
                    from={{ opacity: 0, transform: "translateX(100px)", }}
                    enter={{ opacity: 1, transform: "translateX(0)", }}
                    leave={{ opacity: 0, transform: "translateX(100px)", }}
                    items={showDiv}>
                    {show =>
                        show && (props => (
                            <div className="viewercount-wrapper" style={props}>
                                <FontAwesomeIcon className="icon" icon={faTwitch} />
                                <span className="count">{status.numViewers}</span>
                            </div>
                        ))
                    }
                </Transition>
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
