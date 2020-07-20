import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";

import XLSX from 'xlsx';

import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContentText from '@material-ui/core/DialogContentText';

import { getCourseVotes } from "../firebaseApi";

const styles = theme => ({
});

class InstructorCourseExport extends Component {
    exportVotes() {

        /* 
         * DATA FORMAT:
         *
         * data = [
         *   {
         *     categories: [
         *       'category1',
         *        ...
         *     ],
         *     sessions: [
         *       #, // Number of polls for session 1
         *        ...
         *     ]
         *   },
         *   {
         *     studentName: 'studentName',
         *     studentID: 'studentID',
         *     studentCategories: [
         *       'optionA' // Option chosen for category1
         *        ...
         *     ],
         *     studentVotes: [
         *       'A',
         *        ...
         *     ],
         *   },
         *    ...
         * ]
         */
        getCourseVotes(this.props.course.courseID).then(data => {
            let csvData = [];

            // Populate first row of csv
            csvData.push([]);
            csvData[0].push("studentName");
            csvData[0].push("studentID");
            data[0].categories.forEach(category => {
                csvData[0].push(category);
            });
            let sessionCount = 1;
            data[0].sessions.forEach(numPolls => {
                if (numPolls !== 0) {
                    csvData[0].push("Session " + sessionCount);
                }

                for (let i = 1; i < numPolls; i++) {
                    csvData[0].push(undefined);
                }

                sessionCount++;
            });

            // Populate second row of csv
            csvData.push([]);
            // Blank for student info
            for (let i = 0; i < 2 + data[0].categories.length; i++) {
                csvData[1].push(undefined);
            }
            // Poll# for each session
            data[0].sessions.forEach(numPolls => {
                for (let i = 1; i <= numPolls; i++) {
                    csvData[1].push("Poll " + i);
                }

                sessionCount++;
            });

            // Populate each student row of csv
            for (let i = 1; i < data.length; i++) {
                let student = data[i];
                csvData.push([]);

                // Student name and ID
                csvData[i + 1].push(student.studentName);
                csvData[i + 1].push(student.studentID);

                // Student categories
                student.studentCategories.forEach(category => {
                    if (category === undefined) {
                        csvData[i + 1].push("Unknown");
                    } else {
                        csvData[i + 1].push(category);
                    }
                })

                // Student votes
                student.studentVotes.forEach(vote => {
                    if (vote === undefined) {
                        csvData[i + 1].push(undefined);
                    } else {
                        csvData[i + 1].push(vote);
                    }
                })
            }

            // Generate .csv file
            let wb = XLSX.utils.book_new();
            let ws = XLSX.utils.aoa_to_sheet(csvData);
            let name = this.props.course.courseName + " Votes";
            XLSX.utils.book_append_sheet(wb, ws, name);
            XLSX.writeFile(wb, name + ".csv");

        }).catch(err => {
            console.log(err);
        });
    }

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
                    {"Export " + this.props.course.courseName}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>Export the votes for the course {this.props.course.courseName} as a .csv file?</DialogContentText>
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
                            this.exportVotes();
                            this.props.openCtl(false)
                        }}
                    >
                        Export
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
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(withStyles(styles, {withTheme: true})(withWidth()(InstructorCourseExport))));
