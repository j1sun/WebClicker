import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";

import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import Container from "@material-ui/core/Container";
//import firebase from 'firebase/app'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'
import {changePolls} from "../redux";
import {fetchPoll} from "../firebaseApi";
import {initFirebase} from "../firebaseApi";
import Typography from "@material-ui/core/Typography";
import './slideshow.css';

	const styles = theme => ({
    appBarSpacer: theme.mixins.toolbar,
    mainPage: props => ({
        zIndex: 0,
        marginLeft: props.userMenuOpen ? 260 : 0,
        transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    }),
});




function copyImage(){
	
	try{
		var img=document.getElementById("currentImage");
		
			window.getSelection().removeAllRanges();
		
		var r = document.createRange();
		r.setStartBefore(img);
		r.setEndAfter(img);
		//r.selectNode(img);
		window.getSelection().addRange(r);
		document.execCommand('copy');
		window.getSelection().removeRange(r);
		displayCopiedWindow();
	}
	catch(err5){
	}	
}

function displayCopiedWindow() {
   if (document.getElementById("imageCopied") != null) {
    document.getElementById('imageCopied').style.display = 'block';
	setTimeout(function() {
      document.getElementById('imageCopied').style.display = 'none';
    }, 1000);
  }
}

class Slides extends React.Component {
   constructor (props) {
		super(props);
		
		this.state = {
			imgUrls: [[]],
			currentImageIndex: 0,
			currentFolder:1,
			currentFolderMapped: [],
			isActive:false,
			currentID: this.props.match.params.courseID,
			isLoaded: false
		};
		
		this.handleShowSlides = this.handleShowSlides.bind(this);
		this.handleHideSlides = this.handleHideSlides.bind(this);		
	}
getFilesList(){		
		var storage = firebase.app().storage("gs://iclicker-web-c0d76.appspot.com");
		var storageRef = storage.ref();
		var listRef = storageRef.child("/uploads/"+this.props.match.params.courseID+"/");	
		this.setState({
			isLoaded: false
		});		
				
		listRef.listAll().then(res => {
		  res.prefixes.forEach(folderRef => {
			let tempArray=[];
			folderRef.listAll().then(res2 => {
			  res2.items.forEach(itemRef => {
				  itemRef.getDownloadURL().then(function(url) {tempArray.push(url);}).catch(function(error) {});
			  }); 
			}).catch(function(error) {});
			let newArray = [...this.state.imgUrls];
			  newArray.push(tempArray);
			  this.setState({
				imgUrls: newArray,
				});
		  });
		this.setState({
			isLoaded: true
		});
		}).then(this.updateFolderNum()).catch(function(error2) {
		});
		
}
clearList(){ 	
	this.setState({
		imgUrls: [[]],
	});	
}	
getStats(){ 
	console.log(this.state.imgUrls.length);
	for(let i=0; i<this.state.imgUrls.length; i++){
		console.log(this.state.imgUrls[i].length);
	}
}
handleShowSlides = () => {
		try {
			//getFilesList(this.props.match.params.courseID);	
			this.setState({
			  isActive: true,
			  //currentImageIndex: 0,
			  //currentFolder:1
			});
		}
		catch(err) { 
		}
		this.updateFolderNum();		
	  };

  handleHideSlides = () => {
	  this.clearList();
		this.getFilesList();
		try {
			this.setState({
			  isActive: false,
			  //currentImageIndex: 0,
			  //currentFolder:1
			});
		}
		catch(err) {
		  
		}
	  };
	
	
	
	previousSlide = () => {
		//this.getStats();
		let currentFolder=this.state.currentFolderMapped[this.state.currentFolder-1];
		try {
			var folderNum=0;
			
				for(var i=1; i<this.state.imgUrls.length; i++){
					try{
						if(this.state.imgUrls[i][0].includes("2F"+currentFolder+"%")){
							folderNum=i;		
						}
					}catch(err){}
				}
			
			
			
			const lastIndex = this.state.imgUrls[folderNum].length - 1;
			const { currentImageIndex } = this.state;
			const shouldResetIndex = currentImageIndex <= 0;
			const index =  shouldResetIndex ? lastIndex : currentImageIndex - 1;
			
			this.setState({
				currentImageIndex: index
			});
		}
		catch(err) {
		  
		}
	}
	toLastSlideOfSession = () => {
		this.updateFolderNum();
		let currentFolder=this.state.currentFolderMapped[this.state.currentFolder-1];
		try {
			var folderNum=0;
			try{
				for(var i=1; i<this.state.imgUrls.length; i++){
					if(this.state.imgUrls[i][0].includes("2F"+currentFolder+"%")){
						folderNum=i;		
					}
				}
			}
			catch(err){}
			
			const lastIndex = this.state.imgUrls[folderNum].length - 1;			
			this.setState({
				currentImageIndex: lastIndex
			});
		}
		catch(err) {
		  
		}
	}
	toCurrentSlide = () => {
		this.updateFolderNum();
		let lastFolderNum=this.state.imgUrls.length-1;
		let lastFolder=this.state.currentFolderMapped[this.state.currentFolderMapped.length-1];		
		try {
			let folderNum=0;
			try{
				for(let i=1; i<this.state.imgUrls.length; i++){
					if(this.state.imgUrls[i][0].includes("2F"+lastFolder+"%")){
						folderNum=i;		
					}
				}
			}
			catch(err){folderNum++;}
			let index = this.state.imgUrls[folderNum].length-1;
			this.setState({
				currentImageIndex: index,
				currentFolder: lastFolderNum
			});
		}
		catch(err) { 
		}
		
	}
	
	nextSlide = () => {
		//this.getStats();
		let currentFolder=this.state.currentFolderMapped[this.state.currentFolder-1];
		try {
			var folderNum=0;
			
				for(var i=1; i<this.state.imgUrls.length; i++){
					try{
						if(this.state.imgUrls[i][0].includes("2F"+currentFolder+"%")){
							folderNum=i;		
						}
					}
					catch(err){}
				}
			
			
			const lastIndex = this.state.imgUrls[folderNum].length - 1;
			const { currentImageIndex } = this.state;
			const shouldResetIndex = currentImageIndex >= lastIndex;
			const index =  shouldResetIndex ? 0 : currentImageIndex + 1;

			this.setState({
				currentImageIndex: index
			});
		}
		catch(err) { 
		}	
	}
	
	previousLecture = () => {
		this.updateFolderNum();	
		const lastIndex = this.state.imgUrls.length - 1;
		const { currentFolder } = this.state;
		const shouldResetIndex = currentFolder === 0;
		var index =  shouldResetIndex ? lastIndex : currentFolder - 1;
		if(index == 0){
			index=lastIndex;
		}
		this.setState({
			currentImageIndex: 0,
			currentFolder: index
		});
		
		
	}
	
	nextLecture = () => {	
		this.updateFolderNum();	
		const lastIndex = this.state.imgUrls.length - 1;
		const { currentFolder } = this.state;
		const shouldResetIndex = currentFolder === lastIndex;
		var index =  shouldResetIndex ? 0 : currentFolder + 1;
		if(index == 0){
			index=1;
		}
		this.setState({
			currentImageIndex: 0,
			currentFolder: index
		});
		
		
	}
	
	copyImageToClipboard(){
		copyImage();
	}
	
	getSlideNum(currentFolder){
		currentFolder=this.state.currentFolderMapped[currentFolder-1];
		var folderNum=0;
			for(var i=1; i<this.state.imgUrls.length; i++){
				try{
					if(this.state.imgUrls[i][0].includes("2F"+currentFolder+"%")){
						folderNum=i;		
					}
				}catch(err){}
			}
		return this.state.imgUrls[folderNum].length;
	}
	
	
	getCurrentImage = (currentFolder, currentScreenshot) =>{	
		currentScreenshot+=1;
		//console.log(imgUrls.length+"  "+imgUrls[this.state.currentFolder]);
		currentFolder=this.state.currentFolderMapped[currentFolder-1];
		try {
			  var folderNum=0;
			
				for(var i=1; i<this.state.imgUrls.length; i++){
					try{
						if(this.state.imgUrls[i][0].includes("2F"+currentFolder+"%")){
							folderNum=i;		
						}
					}
					catch(err){}
				}
			
			var h=0;
			for(var i=0; i<this.state.imgUrls[folderNum].length; i++){
				if(this.state.imgUrls[folderNum][i].includes("screenshot"+currentScreenshot+".jpg")){
					h=i;		
				}
			}
			return this.state.imgUrls[folderNum][h];	
		}
		catch(err) {
			return null;	
		}	
	}
	
	downloadCurrentImage(){	
			var ref=document.getElementById("currentImage").src;
			//console.log(ref);
			var reff=ref.substring(0, ref.indexOf('.jpg')+4);
			var storage = firebase.app().storage("gs://iclicker-web-c0d76.appspot.com");
			var httpsReference = storage.refFromURL(reff);
			httpsReference.getDownloadURL().then(function(url) {
				//console.log(url);
			  var xhr = new XMLHttpRequest();
			  xhr.responseType = 'blob';
			  xhr.onload = function(event) {
				  
				var blob = xhr.response;
				var blobUrl = URL.createObjectURL(blob);
				var link = document.createElement("a");
				link.setAttribute("download", "download.jpg");
				link.setAttribute("href", blobUrl);
				link.setAttribute("target", "_blank");
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
    
				
			  };
			  xhr.open('GET', url);
			  xhr.send();
			  //console.log("At end");
			}).catch(function(error) {
			});	
	}
	
	
	
	updateFolderNum(){
		let lectArray= new Array();
			try{
				for(var i=1; i<this.state.imgUrls.length; i++){
					if(this.state.imgUrls[i]!=0){
						var pos=0;
						let matches = this.state.imgUrls[i][0].match(/2F(\d+)%/g); 
						matches[0]=matches[0].substring(1);
						let n=matches[0].match(/\d+/g).map(Number);
						let num=n[0];
						//lectArray.push(num);
						while(num>lectArray[pos]){
							pos++;
						}	
						try{
							lectArray.splice(pos, 0, num);	
						}
						catch(err){
							lectArray.push(num);
						}
					}
				}
				this.setState({
				currentFolderMapped: lectArray,
			});
			}catch(err){}
	}		
	
	getFileStatus(s, m){
		if(s){
			return m;
		}
		else{
			return "Loading Slides...";
		}
		
	}
    componentDidMount() {
		setInterval(this.clearList(), 7000);
		setInterval(this.getFilesList(), 7000);
		//this.getFilesList();
		setInterval(this.updateFolderNum(), 7000);		
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
		this.updateFolderNum();
      if(this.props.match.params.courseID != this.state.currentID){
		this.setState({
			imgUrls: [[]],
			currentImageIndex: 0,
			currentFolder:1,
			isActive:false,
			currentID: this.props.match.params.courseID,
		});
		this.clearList();
		this.getFilesList();
	  }
    }
	

    render() {	
        let mobile = this.props.width === 'sm' || this.props.width === 'xs';
		if (this.state.isActive) {
				return (
					<div className={mobile ? null : this.props.classes.mainPage}>
						<div className={this.props.classes.appBarSpacer}/>	
						
						<div className="fourButton">
							<button onClick={this.handleHideSlides} id="show_hide">{this.getFileStatus(this.state.isLoaded, "Hide Slides")}</button>
							<button onClick={this.downloadCurrentImage}>Download Image</button>
							<button onClick={this.toLastSlideOfSession}>Go To Last Slide</button>
							<button onClick={this.toCurrentSlide}>Go To Current Slide</button>
						</div>
							<div className="slideshow-container">
							
								<div className="slideNum" id="lectureNum">Session {this.state.currentFolder} of {this.state.imgUrls.length-1}</div>
								<Arrow direction="left" clickFunction={ this.previousLecture } glyph="&#10094;" />
								<Arrow direction="right" clickFunction={ this.nextLecture } glyph="&#10095;" />
							</div>	
							
							<div className="slideshow-container">
								<div className="slideNum" id="slideNum">Slide {this.state.currentImageIndex+1} of {this.getSlideNum(this.state.currentFolder)}</div>
								<Arrow direction="left" clickFunction={ this.previousSlide } glyph="&#10094;" />
								<div className="imageCopied" id="imageCopied">Image copied</div>
								<img src={this.getCurrentImage(this.state.currentFolder, this.state.currentImageIndex)} onClick={this.copyImageToClipboard} id="currentImage" style={{width: '100%', verticalAlign: 'middle'}}/>
								<Arrow direction="right" clickFunction={ this.nextSlide } glyph="&#10095;" />
							
							</div>
														
					</div>
				);
		}
		else {
			if((this.state.imgUrls.length-1)==0){
				return (
					<div className={mobile ? null : this.props.classes.mainPage}>
					
						<div className={this.props.classes.appBarSpacer}/>	
						<button className="show_button" id="show_hide">{this.getFileStatus(this.state.isLoaded, "No Slides Available")}</button>
					</div>
				);
			}
			else{
			return (
					<div className={mobile ? null : this.props.classes.mainPage}>
					
						<div className={this.props.classes.appBarSpacer}/>	
						<button onClick={this.handleShowSlides} className="show_button" id="show_hide">{this.getFileStatus(this.state.isLoaded, "View Slides")}</button>
					</div>
				);
			}
		}
    }
}

const mapStateToProps = (state) => {
    return state;
};

const mapDispatchToProps = (dispatch) => {
    return {
        changePolls: (data) => dispatch(changePolls(data)),
    };
};

const Arrow = ({ direction, clickFunction, glyph }) => (
	<div 
		className={ 'slide-arrow '+direction } 
		onClick={ clickFunction }>
		{ glyph } 
	</div>
);

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(withStyles(styles, {withTheme: true})(withWidth()(Slides))));