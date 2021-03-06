import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";

import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import Drawer from '@material-ui/core/Drawer'
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import MoreVertOutlinedIcon from '@material-ui/icons/MoreVertOutlined';
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

import {changeAccount, changeCourses} from "../redux";
import {fetchCourses, signOut} from "../firebaseApi";
import InstructorCourseSettings from "./InstructorCourseSettings";
import InstructorCourseEnrollment from "./InstructorCourseEnrollment";
import InstructorCourseExport from "./InstructorCourseExport";
import { blue } from '@material-ui/core/colors';

const styles = theme => ({
    appBarSpacer: theme.mixins.toolbar,
    headerListItem: {
        height: 64,
        [theme.breakpoints.down('xs')]: {
            height: 56,
        },
    },
    drawer: {
        width: 260,
        zIndex: 1,
    },
});

class InstructorMenu extends Component {
    constructor(props) {
        super(props);
        //console.log("InstructorMenu Constructor", this.props);

        this.state = {
            course: null,
            courseAnchorEl: null,
            courseSettingsOpen: false,
            courseEnrollmentOpen: false,
            courseExportOpen: false,
            allCoursesShown: false,
        };
    }


    componentDidMount() {
        //console.log('InstructorMenu: componentDidMount', this.props);

        if (this.props.account.accountID !== undefined && this.props.account.accountID !== '') {
            let data = {
                accountID: this.props.account.accountID,
            };

            fetchCourses(data).then(courses => {
                this.props.changeCourses(courses)
            });
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        //console.log('InstructorMenu: componentDidUpdate', prevProps, this.props);

        if (this.props.account.accountID !== prevProps.account.accountID) {
            if (this.props.account.accountID !== undefined && this.props.account.accountID !== '') {
                let data = {
                    accountID: this.props.account.accountID,
                };

                fetchCourses(data).then(courses => {
                    this.props.changeCourses(courses)
                });
            }
        }
    }

    componentWillUnmount() {
        //console.log('InstructorMenu: componentWillUnmount');
    }

    render() {
        let mobile = this.props.width === 'sm' || this.props.width === 'xs';

        return (
            <div>
                <Drawer
                    classes={{paper: this.props.classes.drawer}}
                    anchor="left"
                    variant={mobile ? "temporary" : "persistent"}
                    open={this.props.open}
                    onClose={() => {
                        this.props.openCtl(false);
                    }}
                >
                    {mobile ? null : <div className={this.props.classes.appBarSpacer}/>}

                    <ListItem className={this.props.classes.headerListItem}>
                        <ListItemText
                            primary={this.props.account.accountFirstName + " " + this.props.account.accountLastName}
                            secondary={this.props.account.accountEmail}
                        />
                        <IconButton
                            onClick={() => {
                                signOut().then(() => {
                                    this.props.changeAccount({});
                                    this.props.history.push('/login')
                                })
                            }}
                        >
                            <ExitToAppIcon/>
                        </IconButton>
                    </ListItem>

                    <Divider/>

                    <List
                        subheader={<ListSubheader>Active Courses</ListSubheader>}
                    >
                        {Object.values(this.props.courses).map(course =>
                            course.isActive ? (
                            <ListItem
                                key={course.courseName}
                                button
                                selected={this.props.match.params.courseID === course.courseID}
                                onClick={() => {
                                    this.props.history.push('/instructor/' + course.courseID);
                                    if(mobile) {
                                        this.props.openCtl(false);
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={course.courseName}
                                    secondary = {course.courseTerm !== undefined ? course.courseTerm : ''}
                                />

                                <ListItemSecondaryAction>
                                    <IconButton
                                        onClick={(event) => {
                                            this.setState({
                                                course: course.courseID,
                                                courseAnchorEl: event.currentTarget,
                                            })
                                        }}
                                    >
                                        <MoreVertOutlinedIcon/>
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                            ) : null
                        )}

                        <ListItem
                            button
                            onClick={() => {
                                this.setState({
                                    course: null,
                                    courseSettingsOpen: true,
                                });
                            }}
                        >
                            <ListItemIcon>
                                <AddCircleOutlineIcon />
                            </ListItemIcon>
                            <ListItemText primary={'Add Course'} />
                        </ListItem>

                    </List>

                    <List
                        subheader={<ListSubheader>Inactive Courses</ListSubheader>}
                    >
                        {Object.values(this.props.courses).map(course =>
                            this.state.allCoursesShown && (!course.isActive || course.isActive === undefined) ? (
                            <ListItem
                                key={course.courseName}
                                button
                                selected={this.props.match.params.courseID === course.courseID}
                                onClick={() => {
                                    this.props.history.push('/instructor/' + course.courseID);
                                    if(mobile) {
                                        this.props.openCtl(false);
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={course.courseName}
                                    secondary = {course.courseTerm !== undefined ? course.courseTerm : ''}
                                />

                                <ListItemSecondaryAction>
                                    <IconButton
                                        onClick={(event) => {
                                            this.setState({
                                                course: course.courseID,
                                                courseAnchorEl: event.currentTarget,
                                            })
                                        }}
                                    >
                                        <MoreVertOutlinedIcon/>
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                            ) : null
                        )}

                        <ListItem
                            button
                            onClick={() => {
                                this.setState({allCoursesShown: !this.state.allCoursesShown})
                            }}
                        >
                            <ListItemIcon>
                                {this.state.allCoursesShown ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </ListItemIcon>
                            <ListItemText primary={this.state.allCoursesShown ? 'Hide all' : 'Show all'} />
                        </ListItem>
                    </List>

                    <Divider/>
                </Drawer>

                <Menu
                    anchorEl={this.state.courseAnchorEl}
                    open={Boolean(this.state.courseAnchorEl)}
                    onClose={() => {
                        this.setState({
                            course: null,
                            courseAnchorEl: null,
                        });
                    }}
                >
                    <MenuItem
                        button={true}
                        onClick={()=>{
                            this.setState({
                                courseSettingsOpen: true,
                                courseAnchorEl: null,
                            });
                        }}
                    >
                        Settings
                    </MenuItem>

                    <MenuItem
                        button={true}
                        onClick={()=>{
                            this.setState({
                                courseEnrollmentOpen: true,
                                courseAnchorEl: null,
                            });
                        }}
                    >
                        Enrollment
                    </MenuItem>

                    <MenuItem
                        button={true}
                        onClick={()=>{
                            this.setState({
                                courseExportOpen: true,
                                courseAnchorEl: null,
                            });
                        }}
                    >
                        Export votes
                    </MenuItem>
                </Menu>

                <InstructorCourseSettings
                    key={"Settings New"  + this.state.courseSettingsOpen}
                    open={this.state.courseSettingsOpen}
                    openCtl={open => {this.setState({courseSettingsOpen: open})}}
                    newCourse={this.state.course === null}
                    course={this.props.courses[this.state.course]}
                />

                {this.props.courses[this.state.course] === undefined ? null :
                    <InstructorCourseEnrollment
                        key={"Enrollment"  + this.state.courseEnrollmentOpen}
                        open={this.state.courseEnrollmentOpen}
                        openCtl={open => {this.setState({courseEnrollmentOpen: open})}}
                        course={this.props.courses[this.state.course]}
                    />
                }

                {this.props.courses[this.state.course] === undefined ? null :
                    <InstructorCourseExport
                        key={"Export"  + this.state.courseExportOpen}
                        open={this.state.courseExportOpen}
                        openCtl={open => {this.setState({courseExportOpen: open})}}
                        course={this.props.courses[this.state.course]}
                    />
                }
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return state;
};

const mapDispatchToProps = (dispatch) => {
    return {
        changeAccount: (data) => dispatch(changeAccount(data)),
        changeCourses: (data) => dispatch(changeCourses(data)),
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(withStyles(styles, { withTheme: true })(withWidth()(InstructorMenu))));
