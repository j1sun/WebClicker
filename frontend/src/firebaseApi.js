import {firebaseConfig} from "./credentials";
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

export const initFirebase = () => {
    firebase.initializeApp(firebaseConfig);
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);

    /*
    firebase.firestore().enablePersistence().catch((err) => {
        console.log(err)
    });
     */
};

export const listenAuthorization = () => {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                if(user.isAnonymous) {
                    let account = {};

                    account['accountID'] = user.uid;
                    account['accountEmail'] = '';
                    account['accountFirstName'] = 'Anonymous';
                    account['accountLastName'] = '';
                    account['accountType'] = 'student';

                    resolve(account);
                }
                else {
                    firebase.app().firestore().collection('accounts').doc(user.email).get().then(userDoc => {
                        let account = {};

                        account['accountID'] = userDoc.id;
                        account['accountEmail'] = userDoc.id;
                        account['accountFirstName'] = userDoc.get('firstName');
                        account['accountLastName'] = userDoc.get('lastName');
                        account['accountType'] = userDoc.get('type');

                        resolve(account);
                    });
                }
            } else {
                reject();
            }
        });
    });
};

export const anonymousSignIn = () => {
    return new Promise((resolve, reject) => {
        firebase.auth().signInAnonymously().then(userCredential => {
            let account = {};

            account['accountID'] = userCredential.user.uid;
            account['accountEmail'] = '';
            account['accountFirstName'] = 'Anonymous';
            account['accountLastName'] = '';
            account['accountType'] = 'student';

            resolve(account);
        }).catch(err => {
            console.log(err.code, err.message);
        });
    });
};

export const signIn = (data) => {
    let email = data.email;
    let password = data.password;

    return new Promise((resolve, reject) => {
        firebase.auth().signInWithEmailAndPassword(email, password).then(userCredential => {
            firebase.app().firestore().collection('accounts').doc(email).get().then(userDoc => {
                let account = {};

                account['accountID'] = userDoc.id;
                account['accountEmail'] = userDoc.id;
                account['accountFirstName'] = userDoc.get('firstName');
                account['accountLastName'] = userDoc.get('lastName');
                account['accountType'] = userDoc.get('type');

                resolve(account);
            });
        }).catch(err => {
            switch(err.code) {
                case 'auth/invalid-email':
                    reject({emailError: err.message});
                    break;
                case 'auth/user-not-found':
                    reject({emailError: err.message});
                    break;
                case 'auth/wrong-password':
                    reject({passwordError: err.message});
                    break;
                default:
                    console.log(err.code, err.message);
            }
        });
    });
};

export const signUp = (data) => {
    let email = data.email;
    let password = data.password;
    // Auto-capitalize first letter of first/last name
    let firstName = data.firstName.charAt(0).toUpperCase() + data.firstName.slice(1);
    let lastName = data.lastName.charAt(0).toUpperCase() + data.lastName.slice(1);
    let identifier = data.identifier;
    let note = data.note;
    let type = data.type;

    return new Promise((resolve, reject) => {
        firebase.auth().createUserWithEmailAndPassword(email, password).then(() => {
            firebase.firestore().collection('courses').get().then(coursesSnapshot => {
                let studentCourses = [];
                coursesSnapshot.forEach(courseSnapshot => {
                    let promise = courseSnapshot.ref.collection('students').doc(email).get().then(courseStudentSnapshot => {
                        if (courseStudentSnapshot.exists) {
                            return courseStudentSnapshot.ref.update({
                                firstName: firstName,
                                lastName: lastName,
                                identifier: identifier,
                            }).then(() => {
                                return courseSnapshot.id;
                            })
                        }

                        return;
                    });
                    studentCourses.push(promise);
                });

                return Promise.all(studentCourses).then(result => {
                    return result.filter(element => element !== undefined);
                });
            }).then(studentCourses => {
                console.log(studentCourses);
                firebase.app().firestore().collection('accounts').doc(email).set({
                    firstName: firstName,
                    lastName: lastName,
                    identifier: identifier,
                    studentCourses: studentCourses,
                    note: note,
                    type: type,
                });
            }).then(() => {
                firebase.app().firestore().collection('accounts').doc(email).get().then(userDoc => {
                    let account = {};

                    account['accountID'] = userDoc.id;
                    account['accountEmail'] = userDoc.id;
                    account['accountFirstName'] = userDoc.get('firstName');
                    account['accountLastName'] = userDoc.get('lastName');
                    account['accountType'] = userDoc.get('type');

                    resolve(account);
                });
            });
        }).catch(err => {
            switch(err.code) {
                case 'auth/email-already-in-use':
                    reject({emailError: err.message,});
                    break;
                case 'auth/invalid-email':
                    reject({emailError: err.message,});
                    break;
                case 'auth/weak-password':
                    reject({passwordError: err.message,});
                    break;
                default:
                    console.log(err.code, err.message);
                    reject(err);
            }
        });
    })
};

export const signOut = () => {
    return new Promise((resolve, reject) => {
        firebase.auth().signOut().then(() => {
            resolve();
        }).catch(err => {
            console.log(err)
        })
    })
};

/*
 Course-related functions
 */
const getCourse = (doc) => {
    let course = {};

    course['courseID'] = doc.id;
    course['courseName'] = doc.get('courseName');
    course['courseTerm'] = doc.get('courseTerm');
    course['courseCode'] = doc.get('courseCode');
    course['courseCategories'] = doc.get('courseCategories');
    course['courseInstructorID'] = doc.get('courseInstructorID');
    course['courseActivitySessionID'] = doc.get('courseActivitySessionID');
    course['courseActivityPollID'] = doc.get('courseActivityPollID');
    course['courseActivityPollLive'] = doc.get('courseActivityPollLive');
    course['courseActivityPollDisplay'] = doc.get('courseActivityPollDisplay');
    course['students'] = doc.get('students');
    course['isActive'] = doc.get('isActive');

    return course;
};

export const listenCourseActivity = (data) => {
    let courseID = data.courseID;
    let action = data.action;

    return firebase.firestore().collection('courses').doc(courseID).onSnapshot(docSnapshot => {
        let course = getCourse(docSnapshot);
        action(course);
    });
};

export const fetchCourses = (data) => {
    let accountID = data.accountID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('accounts').doc(accountID).get().then(doc => {
            let coursesRef;

            if(doc.get('type') === 'instructor') {
                coursesRef = firebase.firestore().collection('courses').where('courseInstructorID', '==', accountID).get();
            }
            else if(doc.get('type') === 'student') {
                let studentCourses = doc.get('studentCourses');
                if (studentCourses === undefined || studentCourses.length === 0) {
                    resolve({});
                }
                else {
                    coursesRef = firebase.firestore().collection('courses').where(firebase.firestore.FieldPath.documentId(), "in", studentCourses).get();
                }
            }

            coursesRef.then(query => {
                let courses = {};
                let unsorted = [];

                query.forEach((doc) => {
                    let course = getCourse(doc);
                    unsorted.push([doc.id, course]);
                });

                // Sort courses
                unsorted.sort((a, b) => a[1]['courseName'].localeCompare(b[1]['courseName'])).map(course => courses[course[0]] = course[1]);

                resolve(courses);
            }).catch(err => {
                console.log(err);
            })
        }).catch(err => {
            console.log(err);
        });
    });
};

export const searchCourses = (data) => {
    let courseCode = data.courseCode.toUpperCase();

    return new Promise((resolve, reject) => {
        if (courseCode === '' || courseCode === undefined) {
            resolve({});
        }
        else {
            firebase.firestore().collection('courses').where('courseCode', '==', courseCode).get().then(query => {
                let courses = {};

                query.forEach((doc) => {
                    let course = getCourse(doc);
                    courses[doc.id] = course;
                });

                resolve(courses);
            }).catch(err => {
                console.log(err);
            });
        }
    })
};

export const generateCourseCode = () => {
    let uniqueCode = false;

    return new Promise((resolve, reject) => {
        let newCode = "";

        while (!uniqueCode) {
            uniqueCode = true;
            let characters = "ABCDFGHJKLMNOPRSTUVWXYZ"
            for (let i = 0; i < 6; i++) {
                let charLocation = Math.floor(Math.random() * characters.length);
                newCode += characters.charAt(charLocation);
                characters = characters.substring(0, charLocation) + characters.substring(charLocation + 1);
            }

            firebase.firestore().collection('courses').get().then(courses => {
                courses.forEach(course => {
                    if (newCode === course.get('courseID')) {
                        uniqueCode = false;
                    }
                }).catch(() => {
                    resolve("");
                })
            }).catch(() => {
                resolve("");
            })
        }

        resolve(newCode);
    });
}

export const createCourse = (data) => {
    let courseID = data.courseID;
    let courseName = data.courseName;
    let courseTerm = data.courseTerm;
    let courseCode = data.courseCode;
    let courseCategories = data.courseCategories;
    let modifiedCategories = data.modifiedCategories;
    let courseInstructorID = data.courseInstructorID;
    let isActive = data.isActive;

    return new Promise((resolve, reject) => {
        if (courseID == '') {
            firebase.firestore().collection('courses').add({
                courseName: courseName,
                courseTerm: courseTerm,
                courseCode: courseCode,
                courseCategories: courseCategories,
                courseInstructorID: courseInstructorID,
                courseActivitySessionID: '',
                courseActivityPollID: '',
                courseActivityPollLive: false,
                courseActivityPollDisplay: false,
                students: [],
                isActive: isActive,
            }).then(course => {
                resolve(courseID);
            }).catch(err => {
                console.log(err);
            });
        } else {
            firebase.firestore().collection('courses').doc(courseID).update({
                courseName: courseName,
                courseTerm: courseTerm,
                courseCode: courseCode,
                courseCategories: courseCategories,
                courseInstructorID: courseInstructorID,
                courseActivitySessionID: '',
                courseActivityPollID: '',
                courseActivityPollLive: false,
                courseActivityPollDisplay: false,
                isActive: isActive,
            }).then(() => {
                return firebase.firestore().collection('courses').doc(courseID).collection('students').get();
            }).then(studentsSnapshot => {
                return new Promise((resolve, reject) => {
                    let promises = [];
                    studentsSnapshot.forEach(studentSnapshot => {
                        let promise = studentSnapshot.ref.update({
                            studentCategories: Object.fromEntries(
                                    Object.entries(studentSnapshot.get('studentCategories')).reduce((newEntries, [name, option]) => {
                                        if (!modifiedCategories.includes(name)) {
                                            newEntries.push([name, option])
                                        }
                                        return newEntries;
                                    }, []),
                                ),
                        });
                        promises.push(promise);
                    });

                    Promise.all(promises).then(() => {
                        resolve();
                    });
                });
            }).then(() => {
                resolve(courseID);
            }).catch(err => {
                console.log(err);
            });
        }
    });
};

export const fetchCourseStudents = (data) => {
    let courseID = data.courseID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('courses').doc(courseID).collection('students').orderBy('lastName').get().then(query => {
            let students = {};

            query.forEach((doc) => {
                let student = {};
                student['firstName'] = doc.get('firstName');
                student['lastName'] = doc.get('lastName');
                student['identifier'] = doc.get('identifier');
                student['iClicker'] = doc.get('iClicker');
                student['studentCategories'] = doc.get('studentCategories');

                students[doc.id] = student;
            });

            resolve(students);
        }).catch(err => {
            console.log(err);
        });
    });
};

export const setCourseStudents = (data) => {
    let courseID = data.courseID;
    let students = data.students;
    let deletedStudents = data.initialStudents.filter(student => students[student] === undefined);
    console.log(students, deletedStudents);

    return new Promise((resolve, reject) => {
        let promises = [];

        for (let studentID of deletedStudents) {
            let promiseDeleteFromCourse = firebase.firestore().collection('courses').doc(courseID).collection('students').doc(studentID).delete();
            promises.push(promiseDeleteFromCourse);
            let promiseDeleteFromStudent = firebase.firestore().collection('accounts').doc(studentID).get().then((studentSnapshot) => {
                if (studentSnapshot.exists) {
                    firebase.firestore().collection('accounts').doc(studentID).update({
                        studentCourses: firebase.firestore.FieldValue.arrayRemove(courseID)
                    });
                }
            });
            promises.push(promiseDeleteFromStudent);
        }

        for(let studentID in students) {

            let courseStudentRef = firebase.firestore().collection('courses').doc(courseID).collection('students').doc(studentID);
            let promise = courseStudentRef.get().then(courseStudentDoc => {
                if (students[studentID]['firstName'] !== undefined && !courseStudentDoc.exists)  {
                    return firebase.firestore().collection('accounts').doc(studentID).update({
                        studentCourses: firebase.firestore.FieldValue.arrayUnion(courseID),
                    });
                } else {
                    return;
                }
            }).then(() => {
                courseStudentRef.set({
                    firstName: students[studentID]['firstName'] === undefined ? '' : students[studentID]['firstName'],
                    lastName: students[studentID]['lastName'] === undefined ? '' : students[studentID]['lastName'],
                    identifier: students[studentID]['identifier'] === undefined ? '' : students[studentID]['identifier'],
                    iClicker: students[studentID]['iClicker'] === undefined ? '' : students[studentID]['iClicker'],
                    studentCategories: students[studentID]['studentCategories'],
                });
            });
            promises.push(promise);
        }

        Promise.all(promises).then(() => {
            resolve();
        }).catch(err => {
            console.log(err);
        });
    });
};

export const getCourseVotes = (courseID) => {

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
         *     studentFirstName: 'studentFirstName',
         *     studentLastName: 'studentLastName',
         *     studentID: 'studentID',
         *     identifier: 'identifier',
         *     iClicker: 'iClicker',
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
    let data = [
        {
            categories: [],
            sessions: [],
        }
    ];

    return new Promise((resolve, reject) => {
        // Populate data with categories
        let courseRef = firebase.firestore().collection('courses').doc(courseID);
        courseRef.get().then(courseSnapshot => {
            // Get all course categories
            data[0].categories = Object.keys(courseSnapshot.get('courseCategories'));
        }).then(() => { // Populate data with students
            return courseRef.collection('students').get();
        }).then(studentsSnapshot => {
            let promises = [];

            studentsSnapshot.forEach(courseStudentSnapshot => {
                let studentCategories = [];
                data[0].categories.forEach(category => {
                    studentCategories.push(courseStudentSnapshot.get('studentCategories')[category]);
                });

                let promise = firebase.firestore().collection('accounts').doc(courseStudentSnapshot.id).get().then(studentSnapshot => {

                    data.push({
                        studentFirstName: studentSnapshot.get('firstName'),
                        studentLastName: studentSnapshot.get('lastName'),
                        studentID: studentSnapshot.id,
                        identifier: studentSnapshot.get('identifier'), // TODO: If you change identifiers to be course-exclusive, change this to courseStudentSnapshot
                        iClicker: courseStudentSnapshot.get('iClicker'),
                        studentCategories: studentCategories,
                        studentVotes: [],
                    })
                });

                promises.push(promise);
            });

            return Promise.all(promises);
        }).then(() => { // Populate data with votes
            return firebase.firestore().collection('sessions').where('sessionCourseID', '==', courseID).orderBy('sessionStartTime').get();
        }).then(sessionsSnapshot => {
            let promises = [];

            sessionsSnapshot.forEach(sessionSnapshot => {

                let promise = firebase.firestore().collection('polls').where('pollSessionID', '==', sessionSnapshot.id).orderBy('pollStartTime').get().then(pollsSnapshot => {
                    let promises1 = [];
                    let numPolls = 0;

                    pollsSnapshot.forEach(pollSnapshot => {
                        numPolls++;

                        let promise1 = pollSnapshot.ref.collection('students').get().then(pollStudentsSnapshot => {
                            let students = [];

                            pollStudentsSnapshot.forEach(studentSnapshot => {
                                let studentIndex = data.findIndex(obj => obj.studentID === studentSnapshot.id);
                                if (studentIndex !== -1) {
                                    students.push(studentSnapshot.id);
                                    data[studentIndex].studentVotes.push(studentSnapshot.get('studentVote'));
                                }
                            });

                            for (let i = 1; i < data.length; i++) {
                                if (students.indexOf(data[i].studentID) === -1) {
                                    data[i].studentVotes.push(undefined);
                                }
                            }
                        });
                        promises1.push(promise1);
                    });

                    return Promise.all(promises1).then(() => {
                        data[0].sessions.push(numPolls);
                    })
                });

                promises.push(promise);
            });

            return Promise.all(promises);
        }).then(() => {
            resolve(data);
        }).catch(err => {
            console.log(err);
        });
    });

};

/*
 Session-related functions
 */
export const fetchSessions = (data) => {
    let courseID = data.courseID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('sessions').where('sessionCourseID', '==', courseID).orderBy("sessionStartTime").get().then(query => {
            let sessions = {};

            let index = 0;
            query.forEach((doc) => {
                let session = {};
                session['sessionID'] = doc.id;
                session['sessionIndex'] = ++index;
                session['sessionStartTime'] = doc.get('sessionStartTime');
                session['sessionCourseID'] = doc.get('sessionCourseID');
                sessions[doc.id] = session;
            });

            resolve(sessions);
        }).catch(err => {
            console.log(err);
        });
    });
};

export const createSession = (data) => {
    let sessionStartTime = data.sessionStartTime;
    let sessionCourseID = data.sessionCourseID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('sessions').add({
            sessionStartTime: sessionStartTime,
            sessionCourseID: sessionCourseID,
        }).then(session => {
            resolve(session.id);
        }).catch(err => {
            console.log(err);
        });
    })
};

export const activateSession = (data) => {
    let sessionID = data.sessionID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('sessions').doc(sessionID).get().then(session => {
            firebase.firestore().collection('courses').doc(session.get('sessionCourseID')).update({
                courseActivitySessionID: session.id,
                courseActivityPollID: '',
                courseActivityPollLive: false,
                courseActivityPollDisplay: false,
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });

            resolve();
        }).catch(err => {
            console.log(err);
        });
    });
};

export const deactivateSession = (data) => {
    let courseID = data.courseID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('courses').doc(courseID).update({
            courseActivitySessionID: '',
            courseActivityPollID: '',
            courseActivityPollLive: false,
            courseActivityPollDisplay: false,
        }).then(() => {
            resolve()
        }).catch(err => {
            console.log(err);
        });
    });
};

export const deleteSession = (sessionID) => {
    return new Promise((resolve, reject) => {
        firebase.firestore().collection('sessions').doc(sessionID).get().then(sessionSnapshot => {
            // Remove all polls
            return firebase.firestore().collection('polls').where('pollSessionID', '==', sessionID).get().then(pollsSnapshot => {
                let promises = [];
                pollsSnapshot.forEach(pollSnapshot => {
                    let promise = pollSnapshot.ref.collection('students').get().then(studentsSnapshot => {
                        if (!studentsSnapshot.empty) {
                            studentsSnapshot.forEach(studentSnapshot => {
                                studentSnapshot.ref.delete();
                            })
                        }
                    }).then(() => {
                        pollSnapshot.ref.delete();
                    }).catch(err => {
                        console.log(err);
                    });

                    promises.push(promise);
                });

                return Promise.all(promises)
            }).then(() => {
                return sessionSnapshot.ref.delete();
            });
        }).then(() => {
            resolve();
        }).catch(err => {
            console.log(err);
        })
    });
};

/*
 Poll-related functions
 */
const getPoll = (pollDoc) => {
    let poll = {};
    poll['pollID'] = pollDoc.id;
    poll['pollStartTime'] = pollDoc.get('pollStartTime');
    poll['pollSessionID'] = pollDoc.get('pollSessionID');
    poll['pollVotedColor'] = pollDoc.get('pollVotedColor');
    poll['pollCategories'] = pollDoc.get('pollCategories');

    return poll
};

export const fetchPolls = (data) => {
    let sessionID = data.sessionID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('polls').where('pollSessionID', '==', sessionID).orderBy('pollStartTime', 'asc').get().then(pollDocs => {
            let polls = {};

            let index = 0;
            pollDocs.forEach(pollDoc => {
                let poll = getPoll(pollDoc);
                poll['pollIndex'] = ++index;
                polls[pollDoc.id] = poll;
            });

            resolve(polls);
        }).catch((err) => {
            console.log(err);
        });
    });
};

export const fetchPoll = (data) => {
    let pollID = data.pollID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('polls').doc(pollID).get().then(pollDoc => {
            let poll = getPoll(pollDoc);

            resolve(poll);
        }).catch((err) => {
            console.log(err);
        });
    });
};

export const createPoll = (data) => {
    let pollStartTime = data.pollStartTime;
    let pollSessionID = data.pollSessionID;
    let pollVotedColor = data.pollVotedColor;
    let pollCategories = data.pollCategories;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('polls').add({
            pollStartTime: pollStartTime,
            pollSessionID: pollSessionID,
            pollVotedColor: pollVotedColor,
            pollCategories: pollCategories,
        }).then(poll => {
            resolve(poll.id);
        }).catch(err => {
            console.log(err);
        });
    })
};

export const activatePoll = (data) => {
    let pollID = data.pollID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('polls').doc(pollID).get().then(poll => {
            firebase.firestore().collection('sessions').doc(poll.get('pollSessionID')).get().then(session => {
                firebase.firestore().collection('courses').doc(session.get('sessionCourseID')).update({
                    courseActivityPollID: poll.id,
                    courseActivityPollLive: true,
                    courseActivityPollDisplay: false,
                }).then(() => {
                    resolve();
                }).catch(err => {
                    console.log(err);
                });
            }).catch(err => {
                console.log(err);
            });
        }).catch(err => {
            console.log(err);
        });
    });
};

export const deactivatePoll = (data) => {
    let courseID = data.courseID;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('courses').doc(courseID).update({
            courseActivityPollLive: false,
        }).then(() => {
            resolve();
        }).catch(err => {
            console.log(err)
        });
    });
};

export const displayPoll = (data) => {
    let courseID = data.courseID;
    let displayPoll = data.displayPoll;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('courses').doc(courseID).update({
            courseActivityPollDisplay: displayPoll,
        }).then(() => {
            resolve();
        }).catch(err => {
            console.log(err)
        });
    });
};

export const listenPollStudents = (data) => {
    /*
     studentID: 'testStudentID' + i,
     studentVote: 'A',
     studentCategories: {
        'testCategoryName': 'testOptionName'
     },
     */
    let pollID = data.pollID;
    let action = data.action;

    return firebase.firestore().collection('polls').doc(pollID).collection('students').onSnapshot(querySnapshot => {
        let students = {};
        querySnapshot.forEach((doc) => {
            students[doc.id] = {
                iClicker: doc.get('iClicker'),
                studentVote: doc.get('studentVote'),
                studentCategories: doc.get('studentCategories')
            };
        });
        action(students);
    });
};

/*
 Student-specific functions
 */
export const setPollStudent = (data) => {
    let pollID = data.pollID;
    let studentID = data.studentID;
    let vote = data.vote;

    return new Promise((resolve, reject) => {
        firebase.firestore().collection('polls').doc(pollID).get().then(pollDoc => {
            firebase.firestore().collection('sessions').doc(pollDoc.get('pollSessionID')).get().then(sessionDoc => {
                firebase.firestore().collection('courses').doc(sessionDoc.get('sessionCourseID')).collection('students').doc(studentID).get().then(studentDoc => {
                    firebase.firestore().collection('polls').doc(pollID).collection('students').doc(studentID).set({
                        iClicker: studentDoc.get('iClicker') === undefined ? '' : studentDoc.get('iClicker'),
                        studentVote: vote,
                        studentCategories: studentDoc.get('studentCategories') === undefined ? {} : studentDoc.get('studentCategories'),
                    }).then(() => {
                        resolve();
                    }).catch(err => {
                        console.log(err);
                    });
                })
            })
        });
    });
};

export const saveStudentCourse = (data) => {
    let courseID = data.courseID;
    let accountID = data.accountID;
    let firstName = data.firstName;
    let lastName = data.lastName;

    return new Promise((resolve, reject) => {
        let accountRef = firebase.firestore().collection('accounts').doc(accountID);

        accountRef.get().then(accountDoc => {
            accountRef.update({
                studentCourses: firebase.firestore.FieldValue.arrayUnion(courseID)
            }).then(() => {
                let courseStudentInfo = firebase.firestore().collection('courses').doc(courseID).collection('students').doc(accountID);
                courseStudentInfo.get().then(snapshot => {
                    if (snapshot.exists) {
                        resolve();
                    } else {
                        courseStudentInfo.set({
                            studentCategories: {
                            },
                            firstName: firstName,
                            lastName: lastName,
                            identifier: accountDoc.get('identifier') === undefined ? '' : accountDoc.get('identifier'),
                            iClicker: '',
                        }).then(() => {
                            resolve();
                        }).catch(err => {
                            console.log(err);
                        });
                    }
                }).catch(err => {
                    console.log(err);
                });
            }).catch(err => {
                console.log(err);
            })
        }).catch(err => {
            console.log(err);
        });
    });
};

export const fetchAccountDoc = (data) => {
    let accountID = data.accountID;

    return firebase.firestore().collection('accounts').doc(accountID).get();
}