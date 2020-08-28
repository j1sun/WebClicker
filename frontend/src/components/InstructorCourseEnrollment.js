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

import {fetchCourseStudents, setCourseStudents, fetchAccountDoc} from "../firebaseApi";

const styles = theme => ({
});

class InstructorCourseEnrollment extends Component {
    constructor(props) {
        super(props);
        //console.log("InstructorCourseEnrollment props", this.props);

        this.state = {
            studentsData: null,
            currentStudents: null,
            loading: false,
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
                this.setState({
                    studentsData: studentsData,
                    currentStudents: students,
                });
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
                    this.setState({
                        studentsData: studentsData,
                        currentStudents: students,
                    });
                });
            }
        }
    }


    // students is an object of objects for each student
    // studentsData is an array of objects for each student
    convertStudentsToTable(students, courseCategories) {
        let studentsData = [];

        Object.entries(students).forEach(([studentID, student]) => {
            let studentData = {};

            studentData['studentID'] = studentID;
            studentData['firstName'] = student.firstName;
            studentData['lastName'] = student.lastName;
            studentData['identifier'] = student.identifier;
            studentData['iClicker'] = student.iClicker;

            Object.entries(student.studentCategories).forEach(([category, option]) => {
                studentData[category] = courseCategories[category].indexOf(option);
            });

            studentsData.push(studentData);
        });

        return studentsData;
    }

    // studentsData is an array of objects for each student
    // Note that studentsData has a tableData field for each student (which should be ignored)
    // students is an object of objects for each student
    convertTableToStudents(studentsData, courseCategories) {
        let students = {};

        studentsData.forEach(studentData => {
            let student = {
                studentCategories: {},
            };

            Object.entries(studentData).forEach(([columnName, columnInfo]) => {
                switch (columnName) {
                    case "firstName":
                    case "lastName":
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

                <DialogContent>
                    <MaterialTable
                        title={this.props.course.courseName + ' Students'}
                        columns={[
                            {title: 'Email', field: 'studentID', editable: 'onAdd'},
                            {title: 'Last Name', field: 'lastName', editable: 'never'},
                            {title: 'First Name', field: 'firstName', editable: 'never'},
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
                            Add: AddOutlinedIcon,
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
                                    header.push('Email');
                                    header.push('First Name');
                                    header.push('Last Name');
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
                                                case "Email":
                                                    row.push(student['studentID']);
                                                    break;
                                                case "First Name":
                                                    row.push(student['firstName']);
                                                    break;
                                                case "Last Name":
                                                    row.push(student['lastName']);
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
                            onRowAdd: newData => new Promise(resolve => {
                                if (this.state.studentsData.findIndex(student => student.studentID === newData.studentID) !== -1) {
                                    resolve();
                                    return;
                                }

                                let data = {
                                    accountID: newData.studentID,
                                };
                                fetchAccountDoc(data).then(studentDoc => {
                                    if (studentDoc.exists) {
                                        newData['firstName'] = studentDoc.get('firstName');
                                        newData['lastName'] = studentDoc.get('lastName');
                                        newData['identifier'] = studentDoc.get('identifier');
                                    }

                                    let newStudentsData = this.state.studentsData;
                                    newStudentsData.push(newData);
                                    this.setState({studentsData: newStudentsData});
                                }).then(() => {
                                    resolve();
                                });
                            }),
                            onRowUpdate: (newData, oldData) => new Promise(resolve => {
                                let data = this.state.studentsData;
                                data[data.indexOf(oldData)] = newData;
                                this.setState({studentsData: data});

                                resolve();
                            }),
                            onRowDelete: oldData => new Promise(resolve => {
                                let data = this.state.studentsData;
                                data.splice(data.indexOf(oldData), 1);
                                this.setState({
                                    studentsData: data,
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
                                        studentsData.push(new Promise(resolve => {
                                            let studentID = row['Email'];
                                            let data = {
                                                accountID: studentID,
                                            };
                                            fetchAccountDoc(data).then(studentDoc => {
                                                let data = {};
                                                data['studentID'] = studentID;

                                                if (studentDoc.exists) {
                                                    data['firstName'] = studentDoc.get('firstName');
                                                    data['lastName'] = studentDoc.get('lastName');
                                                    data['identifier'] = studentDoc.get('identifier');
                                                }

                                                Object.entries(row).forEach(([field, fieldInfo]) => {
                                                    switch (field) {
                                                        case 'iClicker ID':
                                                            data['iClicker'] = fieldInfo;
                                                            break;
                                                        case 'First Name':
                                                        case 'Last Name':
                                                        case 'Student identifier':
                                                        case 'Email':
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

                                                return data;
                                            }).then(data => {
                                                resolve(data);
                                            })
                                        }));
                                    }

                                    Promise.all(studentsData).then(data => {
                                        this.setState({studentsData: data});
                                    })

                                };

                                reader.readAsArrayBuffer(file);
                            }
                        }}
                    />
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

                            let data = {
                                courseID: this.props.course.courseID,
                                students: students,
                                initialStudents: Object.keys(this.state.currentStudents),
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
