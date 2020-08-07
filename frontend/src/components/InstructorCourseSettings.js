import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";

import ChipInput from "material-ui-chip-input";

import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import TextField from "@material-ui/core/TextField";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import InputLabel from "@material-ui/core/InputLabel";
import Switch from "@material-ui/core/Switch";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import IconButton from '@material-ui/core/IconButton';
import RefreshIcon from '@material-ui/icons/Refresh';
import ClearIcon from '@material-ui/icons/Clear';
import LinearProgress from '@material-ui/core/LinearProgress';

import {createCourse, fetchCourses, generateCourseCode} from "../firebaseApi";
import {changeCourses} from "../redux";
import { blue, yellow } from '@material-ui/core/colors';

const styles = theme => ({
    titleBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    },
    courseCode: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    },
    generateButton: {
        marginX: '12px'
    },
    clearButton: {
        marginLeft: '12px'
    },
});

class InstructorCourseSettings extends React.Component {
    constructor(props) {
        super(props);
        //console.log("InstructorCourseSettings props", this.props);

        this.state = {
            courseID: this.props.course === undefined ? '' : this.props.course.courseID,
            name: this.props.course === undefined ? '' : this.props.course.courseName,
            term: this.props.course === undefined ? '' : (this.props.course.courseTerm === undefined ? '' : this.props.course.courseTerm),
            courseCode: this.props.course === undefined ? "None" : (this.props.course.courseCode === undefined ? '' : this.props.course.courseCode),
            isActive: this.props.course === undefined || (this.props.course.isActive === undefined ? false : this.props.course.isActive),
            categoryNames: this.props.course === undefined ? [] : Object.keys(this.props.course.courseCategories),
            optionNames: this.props.course === undefined ? [] : Object.values(this.props.course.courseCategories).map(value => value.slice()),
            loading: false,

            nameError: '',
            termError: '',
            quarterError: '',
            courseCodeError: '',
            categoryNamesErrors: '',
            optionNamesErrors: this.props.course === undefined ? [] : Object.keys(this.props.course.courseCategories).map(() => ""),
        };
    }

    render() {
        let mobile = this.props.width === 'sm' || this.props.width === 'xs';

        return (
            <Dialog
                disableBackdropClick
                disableEscapeKeyDown
                fullScreen={mobile}
                fullWidth
                maxWidth="sm"
                open={this.props.open}
                onClose={() => {this.props.openCtl(false)}}
            >
                <DialogTitle>
                    <div className={this.props.classes.titleBar}>
                        <div>
                            {this.props.newCourse ? 'Add Course' : 'Course Settings'}
                        </div>

                        <FormControlLabel
                            control={
                            <Switch
                                checked={this.state.isActive}
                                onChange={(event) => {
                                    this.setState({
                                        isActive: event.target.checked,
                                    });
                                }}
                                name="active"
                            />
                            }
                            label="Active course"
                            labelPlacement="start"
                        />
                    </div>
                </DialogTitle>

                <DialogContent>

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Course Name"
                        value={this.state.name}
                        error={this.state.nameError.length !== 0}
                        helperText={this.state.nameError}
                        onChange={(event) => {
                            this.setState({
                                name: event.target.value,
                                nameError: '',
                            });
                        }}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Course Term"
                        value={this.state.term}
                        error={this.state.termError.length !== 0}
                        helperText={this.state.termError.length === 0 ? 'eg. Fall 2020' : this.state.termError}
                        onChange={(event) => {
                            this.setState({
                                term: event.target.value,
                                termError: '',
                            });
                        }}
                    />

                    <div className={this.props.classes.courseCode} >
                        <TextField
                            fullWidth
                            disabled
                            margin="normal"
                            label="Course code"
                            value={this.state.courseCode === '' ? "None" : this.state.courseCode}
                            error={this.state.courseCodeError.length !== 0}
                            helperText={this.state.courseCodeError}
                        />

                        <IconButton
                            className={this.props.classes.generateButton}
                            variant="outlined"
                            onClick={() => {
                               generateCourseCode().then(newCode => {
                                    this.setState({
                                        courseCode: newCode,
                                        courseCodeError: ''
                                    })
                               })
                            }}
                        >
                            <RefreshIcon />
                        </IconButton>

                        <IconButton
                            className={this.props.classes.clearButton}
                            variant="outlined"
                            onClick={() => {
                                this.setState({
                                    courseCode: '',
                                    courseCodeError: ''
                                })
                            }}
                        >
                            <ClearIcon />
                        </IconButton>
                    </div>

                    <ChipInput
                        fullWidth
                        margin="normal"
                        label="Categories"
                        placeholder=""
                        value={this.state.categoryNames}
                        helperText={
                            this.props.course === undefined || Object.keys(this.props.course.courseCategories).filter(value => !this.state.categoryNames.includes(value)).length === 0 ?
                                    "" :
                                    "Warning: Deleted categories cannot be recovered!"
                        }
                        onAdd={categoryName => {
                            let newCategoryNames = this.state.categoryNames;
                            let newOptionNames = this.state.optionNames;
                            let newOptionNamesErrors = this.state.optionNamesErrors;
                            newCategoryNames.push(categoryName);
                            
                            if (this.props.course !== undefined && this.props.course.courseCategories[categoryName] !== undefined) {
                                newOptionNames.push(this.props.course.courseCategories[categoryName].slice());
                            } else {
                                newOptionNames.push([]);
                            }
                            newOptionNamesErrors.push("");

                            this.setState({
                                categoryNames: newCategoryNames,
                                optionNames: newOptionNames,
                                optionsErrors: newOptionNamesErrors,
                            });
                        }}
                        onDelete={(categoryName, categoryIndex) => {
                            let newCategoryNames = this.state.categoryNames;
                            let newOptionNames = this.state.optionNames;
                            let newOptionNamesErrors = this.state.optionNamesErrors;
                            newCategoryNames.splice(categoryIndex, 1);
                            newOptionNames.splice(categoryIndex, 1);
                            newOptionNamesErrors.splice(categoryIndex, 1);

                            this.setState({
                                categoryNames: newCategoryNames,
                                optionNames: newOptionNames,
                                optionsErrors: newOptionNamesErrors,
                            });
                        }}
                    />

                    {this.state.categoryNames.map((categoryName, categoryIndex) =>
                        <ChipInput
                            key={categoryName}
                            fullWidth
                            margin="normal"
                            label={categoryName}
                            placeholder=""
                            value={this.state.optionNames[categoryIndex]}
                            error={this.state.optionNamesErrors[categoryIndex].length !== 0}
                            helperText={
                                this.state.optionNamesErrors[categoryIndex].length !== 0 ? 
                                    this.state.optionNamesErrors[categoryIndex] :
                                    this.props.course === undefined || this.props.course.courseCategories[categoryName] === undefined || this.props.course.courseCategories[categoryName].filter(value => !this.state.optionNames[categoryIndex].includes(value)).length === 0 ?
                                        "" :
                                        "Warning: Deleting this category's options will reset the student options for this category!"

                            }
                            onAdd={optionName => {
                                let newOptionNames = this.state.optionNames;
                                let newOptionNamesErrors = this.state.optionNamesErrors;
                                newOptionNames[categoryIndex].push(optionName);
                                newOptionNamesErrors[categoryIndex] = "";

                                this.setState({
                                    optionNames: newOptionNames,
                                    optionNamesErrors: newOptionNamesErrors,
                                });
                            }}
                            onDelete={(optionName, optionIndex) => {
                                let newOptionNames = this.state.optionNames;
                                let newOptionNamesErrors = this.state.optionNamesErrors;
                                newOptionNames[categoryIndex].splice(optionIndex, 1);
                                newOptionNamesErrors[optionIndex] = "";

                                this.setState({
                                    optionNames: newOptionNames,
                                    optionNamesErrors: newOptionNamesErrors,
                                });
                            }}
                        />
                    )}
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
                            let error = false;
                            this.setState({loading: true});

                            // The course name cannot be empty
                            if(this.state.name.length === 0) {
                                this.setState({nameError: 'Please specify a course name.'});
                                error = true;
                            }

                            // The term cannot be empty
                            if(this.state.term.length === 0) {
                                this.setState({termError: 'Please specify a term (eg. Fall 2020).'});
                                error = true;
                            }

                            // The category options cannot be empty
                            let newOptionNamesErrors = this.state.optionNamesErrors;
                            this.state.optionNames.forEach((optionNames, optionIndex) => {
                                if (optionNames.length === 0) {
                                    newOptionNamesErrors[optionIndex] = 'Please specify at least one option for this category.';
                                    error = true;
                                }
                            });

                            this.setState({optionNamesErrors: newOptionNamesErrors});

                            if(!error) {
                                let courseCategories = {};
                                let modifiedCategories = []; // Contains all categories that were deleted or had removed options

                                this.state.categoryNames.forEach((categoryName, categoryIndex) => {
                                    courseCategories[categoryName] = this.state.optionNames[categoryIndex];

                                    // Add all categories with removed options to modifiedCategories
                                    if (this.props.course !== undefined && this.props.course.courseCategories[categoryName] !== undefined && this.props.course.courseCategories[categoryName].filter(value => !this.state.optionNames[categoryIndex].includes(value)).length !== 0) {
                                        modifiedCategories.push(categoryName);
                                    }
                                });

                                // Add all categories that were deleted to modifiedCategories
                                modifiedCategories = modifiedCategories.concat(
                                    this.props.course === undefined ? [] :
                                        Object.keys(this.props.course.courseCategories).filter(value => !this.state.categoryNames.includes(value))
                                );

                                let data = {
                                    courseID: this.state.courseID,
                                    courseName: this.state.name,
                                    courseTerm: this.state.term,
                                    courseCode: this.state.courseCode,
                                    courseCategories: courseCategories,
                                    modifiedCategories: modifiedCategories,
                                    courseInstructorID: this.props.account.accountID,
                                    courseActivitySessionID: '',
                                    courseActivityPollID: '',
                                    isActive: this.state.isActive,
                                };

                                createCourse(data).then(() => {
                                    let data = {
                                        accountID: this.props.account.accountID,
                                    };

                                    fetchCourses(data).then(courses => {
                                        this.props.openCtl(false);
                                        this.props.changeCourses(courses);
                                    });
                                });
                            } else {
                                this.setState({loading: false});
                            }
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>

                {this.state.loading && <LinearProgress />}
            </Dialog>
        );
    }
}

const mapStateToProps = (state) => {
    return state;
};

const mapDispatchToProps = (dispatch) => {
    return {
        changeCourses: (data) => dispatch(changeCourses(data)),
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(withStyles(styles, {withTheme: true})(withWidth()(InstructorCourseSettings))));
