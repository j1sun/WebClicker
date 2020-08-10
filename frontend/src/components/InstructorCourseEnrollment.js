import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";

import XLSX from 'xlsx';
import MaterialTable from 'material-table';

import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import Typography from "@material-ui/core/Typography";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Paper from '@material-ui/core/Paper';
import AddOutlinedIcon from '@material-ui/icons/AddOutlined';
import DeleteOutlinedIcon from '@material-ui/icons/DeleteOutlined';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import DoneOutlinedIcon from '@material-ui/icons/DoneOutlined';
import ClearOutlinedIcon from '@material-ui/icons/ClearOutlined';
import SearchOutlinedIcon from '@material-ui/icons/SearchOutlined';
import NavigateNextOutlinedIcon from '@material-ui/icons/NavigateNextOutlined';
import NavigateBeforeOutlinedIcon from '@material-ui/icons/NavigateBeforeOutlined';
import AttachFileOutlinedIcon from '@material-ui/icons/AttachFileOutlined';
import GetAppOutlinedIcon from '@material-ui/icons/GetAppOutlined';
import LinearProgress from '@material-ui/core/LinearProgress';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

import {fetchCourseStudents, setCourseStudents} from "../firebaseApi";

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const styles = theme => ({
});

class InstructorCourseEnrollment extends Component {
    constructor(props) {
        super(props);
        //console.log("InstructorCourseEnrollment props", this.props);

        this.state = {
            studentsData: null,
            deletedStudents: [],
            loading: false,
            error: false,
            errorStatus: null,
            errorSeverity: null,
            errorMessage: '',
        };

        this.studentFileRef = React.createRef();
    }

    componentDidMount() {
        //console.log('InstructorCourseEnrollment: componentDidMount', this.props);

        if (this.props.course !== undefined) {
            let data = {
                courseID: this.props.course.courseID,
            };

            fetchCourseStudents(data).then(students => {
                let studentsData = this.convertStudentsToTable(students, this.props.course.courseCategories);
                this.setState({studentsData: studentsData});
            });
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        //console.log('InstructorCourseEnrollment: componentDidUpdate', prevProps, this.props);

        if (this.props.course !== prevProps.course) {
            if (this.props.course !== undefined) {
                let data = {
                    courseID: this.props.course.courseID,
                };

                fetchCourseStudents(data).then(students => {
                    let studentsData = this.convertStudentsToTable(students, this.props.course.courseCategories);
                    this.setState({studentsData: studentsData});
                });
            }
        }
    }

    convertStudentsToTable(students, courseCategories) {
        let studentsData = [];

        Object.entries(students).forEach(([studentID, student]) => {
            let studentData = {};

            studentData['studentID'] = studentID;
            studentData['name'] = student.name;
            studentData['identifier'] = student.identifier;
            studentData['iClicker'] = student.iClicker;

            Object.entries(student.studentCategories).forEach(([category, option]) => {
                studentData[category] = courseCategories[category].indexOf(option);
            });

            studentsData.push(studentData);
        });

        return studentsData;
    }

    convertTableToStudents(studentsData, courseCategories) {
        let students = {};

        studentsData.forEach(studentData => {
            let student = {
                studentCategories: {},
            };

            Object.entries(studentData).forEach(([columnName, columnInfo]) => {
                switch (columnName) {
                    case "name":
                    case "identifier":
                    case "iClicker":
                        student[columnName] = columnInfo
                        break;
                    case "studentID":
                    case "tableData":
                        break;
                    default:
                        let optionName = courseCategories[columnName][columnInfo];
                        if(optionName !== undefined) {
                            student['studentCategories'][columnName] = optionName;
                        }
                        break;
                }
            });

            students[studentData['studentID']] = student;
        });

        return students;
    }

    render() {
        let mobile = this.props.width === 'sm' || this.props.width === 'xs';

        return (
            <Dialog
                disableBackdropClick
                disableEscapeKeyDown
                fullScreen={mobile}
                fullWidth
                maxWidth="xl"
                open={this.props.open}
                onClose={() => {this.props.openCtl(false)}}
            >
                <DialogTitle>
                    {this.props.course.courseName + ' Students'}
                </DialogTitle>

                <DialogContent>
                    <MaterialTable
                        title="Students"
                        columns={[
                            {title: 'Name', field: 'name', editable: 'never'},
                            {title: 'Student Identifier', field: 'identifier', editable: 'never'},
                            {title: 'iClicker ID', field: 'iClicker'},
                        ].concat(
                            Object.keys(this.props.course.courseCategories).map((category) => {
                                return {
                                    title: category,
                                    field: category,
                                    emptyValue: 'Unknown',
                                    lookup: Object.assign({'-1': 'Unknown'}, this.props.course.courseCategories[category]),
                                }
                            })
                        )}
                        data={this.state.studentsData === null ? [] : this.state.studentsData}
                        icons={{
                            Delete: DeleteOutlinedIcon,
                            Edit: EditOutlinedIcon,
                            Check: DoneOutlinedIcon,
                            Clear: ClearOutlinedIcon,
                            Search: SearchOutlinedIcon,
                            NextPage: NavigateNextOutlinedIcon,
                            PreviousPage: NavigateBeforeOutlinedIcon,
                            ResetSearch: ClearOutlinedIcon,
                        }}
                        components={{Container: (props) => <Paper {...props} elevation={0}/>}}
                        options={{
                            showFirstLastPageButtons: false,
                        }}
                        actions={[
                            {
                                icon: AttachFileOutlinedIcon,
                                tooltip: 'Upload Excel File',
                                isFreeAction: true,
                                onClick: () => {
                                    this.studentFileRef.current.click()
                                }
                            },
                            {
                                icon: GetAppOutlinedIcon,
                                tooltip: 'Download Excel File',
                                isFreeAction: true,
                                onClick: () => {
                                    let csvData = [];

                                    // Populate header of csv
                                    let header = [];
                                    header.push('Database ID');
                                    header.push('Name');
                                    header.push('Student identifier');
                                    header.push('iClicker ID');
                                    Object.entries(this.props.course.courseCategories).forEach(([category, options]) => {
                                        let headerString = category + " (Options: ";
                                        options.forEach(option => {
                                            headerString += option + " | ";
                                        })
                                        headerString += "<blank> )"
                                        header.push(headerString);
                                    });
                                    csvData.push(header);

                                    this.state.studentsData.forEach(student => {
                                        let row = [];
                                        header.forEach(field => {
                                            switch (field) {
                                                case "Database ID":
                                                    row.push(student['studentID']);
                                                    break;
                                                case "Name":
                                                    row.push(student['name']);
                                                    break;
                                                case "Student identifier":
                                                    row.push(student['identifier']);
                                                    break;
                                                case "iClicker ID":
                                                    row.push(student['iClicker']);
                                                    break;
                                                case "tableData":
                                                    break;
                                                default:
                                                    let categoryName = field.split(" (Options: ")[0];
                                                    let optionName = this.props.course.courseCategories[categoryName][student[categoryName]];
                                                    row.push(optionName);
                                                    break;
                                            }
                                        });

                                        csvData.push(row);
                                    });

                                    let wb = XLSX.utils.book_new();
                                    let ws = XLSX.utils.aoa_to_sheet(csvData);
                                    let name = this.props.course.courseName + " Students";
                                    XLSX.utils.book_append_sheet(wb, ws, name);
                                    XLSX.writeFile(wb, name + ".csv");
                                }
                            }
                        ]}
                        editable={{
                            onRowUpdate: (newData, oldData) => new Promise(resolve => {
                                if (Object.keys(newData).length - 4 !== Object.keys(this.props.course.courseCategories).length) {
                                    resolve();
                                    return;
                                }

                                let data = this.state.studentsData;
                                data[data.indexOf(oldData)] = newData;
                                this.setState({studentsData: data});

                                resolve();
                            }),
                            onRowDelete: oldData => new Promise(resolve => {
                                let data = this.state.studentsData;
                                data.splice(data.indexOf(oldData), 1);
                                let deletedData = [...this.state.deletedStudents, oldData];
                                this.setState({
                                    studentsData: data,
                                    deletedStudents: deletedData,
                                });

                                resolve();
                            })
                        }}
                    />

                    <input
                        hidden={true}
                        ref={this.studentFileRef}
                        className="FileInput"
                        type="file"
                        accept=".csv"
                        onChange={(event) => {
                            if (event.target.files.length !== 0) {
                                let file = event.target.files[0];

                                const reader = new FileReader();

                                // Define how to extract the students from the excel file
                                reader.onload = (event) => {
                                    // Parse data
                                    var data = new Uint8Array(event.target.result);
                                    var wb = XLSX.read(data, {type: 'array'});

                                    // Get student worksheet
                                    let studentSheet = wb.Sheets[wb.SheetNames[0]];
                                    // Convert student worksheet to json
                                    let studentJson = XLSX.utils.sheet_to_json(studentSheet);

                                    // Convert student json to table format
                                    let studentsData = [];
                                    for (let row of studentJson) {
                                        let studentID = row['Database ID'];
                                        let studentIndex = this.state.studentsData.findIndex(student => student['studentID'] === studentID);

                                        if (this.state.studentsData[studentIndex] !== undefined) {
                                            let data = {};

                                            data['studentID'] = studentID;

                                            Object.entries(row).forEach(([field, fieldInfo]) => {
                                                switch (field) {
                                                    case 'Name':
                                                        data['name'] = fieldInfo;
                                                        break;
                                                    case 'Student identifier':
                                                        data['identifier'] = fieldInfo;
                                                        break;
                                                    case 'iClicker ID':
                                                        data['iClicker'] = fieldInfo;
                                                        break;
                                                    case 'Database ID':
                                                        break;
                                                    default:
                                                        let categoryName = field.split(" (Options: ")[0];
                                                        let categoryInfo = this.props.course.courseCategories[categoryName];
                                                        if (categoryInfo !== undefined) {
                                                            data[categoryName] = categoryInfo.indexOf(fieldInfo);
                                                        }
                                                        break;
                                                }
                                            });

                                            studentsData.push(data);
                                        } else {
                                            let errorMessage = 'Row ' + (studentJson.indexOf(row) + 1) + ': Student not found.'
                                            this.setState({
                                                error: true,
                                                errorSeverity: 'error',
                                                errorMessage: errorMessage,
                                            });
                                            return;
                                        }
                                    }

                                    this.setState({studentsData: studentsData});
                                };

                                reader.readAsArrayBuffer(file);
                            }
                        }}
                    />

                    <Snackbar
                        open={this.state.error}
                        autoHideDuration={5000}
                        onClose={(event, reason) => {
                            if (reason !== 'clickaway') {
                                this.setState({
                                    error: false,
                                });
                            }
                        }}
                    >
                        <Alert
                            onClose={(event, reason) => {
                                if (reason !== 'clickaway') {
                                    this.setState({
                                        error: false,
                                    });
                                }
                            }}
                            severity={this.state.errorSeverity}
                        >
                            {this.state.errorMessage}
                        </Alert>
                    </Snackbar>
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
                            this.setState({loading: true});

                            let students = this.convertTableToStudents(this.state.studentsData, this.props.course.courseCategories);
                            let deleted = this.convertTableToStudents(this.state.deletedStudents, this.props.course.courseCategories);

                            let data = {
                                courseID: this.props.course.courseID,
                                students: students,
                                deleted: deleted
                            };

                            setCourseStudents(data).then(() => {
                                this.props.openCtl(false);
                            });
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
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(withStyles(styles, {withTheme: true})(withWidth()(InstructorCourseEnrollment))));
