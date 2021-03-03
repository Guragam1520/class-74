import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, TextInput,Image,Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';

import firebase from 'firebase';
import db from '../config.js';

export default class Transactionscreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedData: '',
        buttonState: 'normal',
        scannedBookId: " ",
        scannedStudentId: " ",
        transactionMessage: ' '
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state
      if(buttonState === "Book ID"){
        this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: 'normal'
        });
      }

      else if(buttonState === "Student ID"){
        this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: 'normal'
        });
      }
    }

    initiateBookIssue = async() =>{
      db.collection("transactions").add({
        'studentId' : this.state.scannedStudentId,
        'bookId': this.state.scannedBookId,
        'date': firebase.firestore.Timestamp.now().toDate(),
        'transactionType' : "Issue"
      })
      db.collection("books").doc(this.state.scannedBookId).update({
        'bookAvailability' : false
      })
      db.collection("students").doc(this.state.scannedStudentId).update({
        'numberOfBooksIssued': firebase.firestore.FieldValue.increment(1)
      })
      Alert.alert("Book Issued")
      this.setState({
        scannedBookId : "",
        scannedStudentId: ""
      })
    }

    initiateBookReturn = async() =>{
      db.collection("transactions").add({
        'studentId' : this.state.scannedStudentId,
        'bookId': this.state.scannedBookId,
        'date': firebase.firestore.Timestamp.now().toDate(),
        'transactionType' : "Return"
      })
      db.collection("books").doc(this.state.scannedBookId).update({
        'bookAvailability' : true
      })
      db.collection("students").doc(this.state.scannedStudentId).update({
        'numberOfBooksIssued': firebase.firestore.FieldValue.increment(-1)
      })
      Alert.alert("Book Returned")
      this.setState({
        scannedBookId : "",
        scannedStudentId: ""
      })
    }
    checkStudentEligibilityForBookIssue=async()=>{
      const studentref=await db.collection("students").where("studentID","==",this.state.scannedStudentId).get()
      var isStudentEligible= ''
      if(studentref.docs.length==0){
        this.setState({scannedStudentId:'', scannedBookId:''})
        isStudentEligible=false
        Alert.alert("StudentID does not exist in our database")
      }
      else{
        studentref.docs.map((doc)=>{
          var student=doc.data()
          if(student.numberOfBooksIssued<2){
            isStudentEligible=true
          }else{
            isStudentEligible=false
            Alert.alert("Student already has issued 2 books")
            this.setState({scannedStudentId:'', scannedBookId:''})
          }
        })
      }
      return isStudentEligible;
      
    }
    checkStudentEligibilityForBookReturn=async()=>{
      const transactionref=await db.collection("transactions").where("bookID", "==", this.state.scannedBookId).get()
      var isStudentEligible=''
      transactionref.docs.map((doc)=>{
       var lastBookTransaction=doc.data()
       if(lastBookTransaction.studentId==this.state.scannedBookId){
         isStudentEligible=true
       }else{
         isStudentEligible=false
         Alert.alert("This book was not issued by the student")
         this.setState({scannedStudentId:'', scannedBookId:''})
       }
      })
      return isStudentEligible;
    }

    checkBookEligibility=async()=>{
      const bookref=await db.collection("books").where("bookID", "==", this.state.scannedBookId).get()
      var transactionType='';
      if(bookref.docs.length==0){
        transactionType=false;
      }else{
      bookref.docs.map((doc)=>{
        var book=doc.data();
        if(book.bookAvailability){
          transactionType="Issue";
        }else{
          transactionType="Return";
        }
      })
      }
      return transactionType;
    }
    handleTransaction = async() =>{
      var transactionType=await this.checkBookEligibility();
      console.log("transactionType"+transactionType);
      if(!transactionType){
        Alert.alert("This book does not exist in library database");
        this.setState({scannedBookId:'', scannedStudentId:''});
      }
      else if(transactionType==="Issue"){
        var isStudentEligible=await this.checkStudentEligibilityForBookIssue();
        if(isStudentEligible){
          this.initiateBookIssue();
          Alert.alert("Book Issued to the Student");
        }
      }
      else{
        var isStudentEligible=await this.checkStudentEligibilityForBookReturn();
        if(isStudentEligible){
          this.initiateBookReturn();
          Alert.alert("Book Returned to the Library");
        }
      }
    }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned = {scanned ? undefined : this.handleBarCodeScanned}
            style = {StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <View style={styles.container}>
          <View> 
            <Image style = {{width: 200,height: 200}}
                   source = {require('../assets/booklogo.jpg')}/>
            <Text style = {{textAlign: "center", fontSize: 30}}> 
              Willy </Text>
          </View>
          <View style = {styles.inputView}>  
            <TextInput style = {styles.inputBox}
              placeholder = "Book ID"
              value = {this.state.scannedBookId}
              onChangeText = {text => {this.setState({scannedBookId:text})}}
             /> 
            <TouchableOpacity
              onPress = {() => {this.getCameraPermissions("Book ID")}}
              style = {styles.scanButton}>
              <Text style = {styles.buttonText}> Scan </Text>
            </TouchableOpacity>
          </View>

          <View style = {styles.inputView}> 
            <TextInput style = {styles.inputBox}
              placeholder = "Student ID"
              value = {this.state.scannedStudentId}
              onChangeText = {text => {this.setState({scannedStudentId:text})}}
             /> 
            <TouchableOpacity
              onPress = {() => {this.getCameraPermissions("Student ID")}}
              style = {styles.scanButton}>
              <Text style = {styles.buttonText}> Scan </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style = {styles.submitButton}
                            onPress = {async() => {
                              var transactionMessage = await this.handleTransaction()
                           //   this.setState({
                           //    scannedBookId : " ",
                           //   scannedStudentId: " "
                           //   })
                            }}>
        <Text style = {styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>

        </View>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    buttonText:{
      fontSize: 15,
      textAlign: "center",
      marginTop: 10
    },
    inputView: {
      flexDirection: "row",
      margin: 20, 
    },
    inputBox: {
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    submitButton :{
        backgroundColor : "pink",
        width : 100,
        height: 50
    },
    submitButtonText:{
        padding: 10,
        textAlign : 'center',    
        fontSize : 20,
        fontWeight: 'bold',
        color: 'white'
    }
  });