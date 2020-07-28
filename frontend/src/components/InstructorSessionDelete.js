import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";

import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContentText from '@material-ui/core/DialogContentText';

import { deleteSession, fetchSessions } from '../firebaseApi';
import {changeSessions} from '../redux';

const styles = theme => ({
});

class InstructorSessionDelete extends Component {

    render() {
        let mobile = this.props.width === 'sm' || this.props.width === 'xs';

        return (
            <Dialog
                fullScreen={mobile}
                fullWidth
                maxWidth="sm"
                open={this.props.open}
                onClose={() => {this.props.openCtl(false)}}
            >
                <DialogTitle>
                    {"Delete Session " + this.props.session.sessionIndex + "?"}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>Deleting this session will remove all of its poll information and is irreversible! Are you sure you want to delete this session?</DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button
                        color="primary"
                        onClick={() => {
                            this.props.openCtl(false);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        color="primary"
                        onClick={() => {
                            deleteSession(this.props.session.sessionID).then(() => {
                                let data = {
                                    courseID: this.props.session.sessionCourseID,
                                };

                                fetchSessions(data).then(data => {
                                    this.props.openCtl(false);
                                    this.props.changeSessions(data);
                                });
                            });
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

const mapStateToProps = (state) => {
    return state;
};

const mapDispatchToProps = (dispatch) => {
    return {
        changeSessions: (data) => dispatch(changeSessions(data)),
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(withStyles(styles, {withTheme: true})(withWidth()(InstructorSessionDelete))));
