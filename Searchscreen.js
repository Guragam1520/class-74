import React from 'react';
import {Text, View, ScrollView, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import db from '../config.js';

export default class Searchscreen extends React.Component {
    constructor(){
        super();
        this.state={
            allTransactions:[],
            lastVisibleTransaction:null,
            search:''
        }
    }
    componentDidMount=async()=>{
        const query=await db.collection("transactions").get()
        query.docs.map((doc)=>{
            this.setState({
               allTransactions:[...this.state.allTransactions, doc.data()]
             })
        }) 
    }
    fetchMoreTransactions=async()=>{
    var text=this.state.search.toUpperCase()
    var enteredtext=text.split('')
   
    if(enteredtext[0].toUpperCase()==="B"){
        const query=await db.collection("transaction").where("bookId","==",text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions, doc.data()],
                lastVisibleTransaction:doc
              })
        })
    }else if(enteredtext[0].toUpperCase()==="S"){
        const query=await db.collection("transaction").where("studentId","==",text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions, doc.data()],
                lastVisibleTransaction:doc
              })
        })
    }
}
    searchTransactions=async(text)=>{
    var enteredtext=text.split('')
    var text=text.toUpperCase()
    if(enteredtext[0].toUpperCase()==="B"){
        const transaction=await db.collection("transaction").where("bookId","==",text).get()
        transaction.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions, doc.data()],
                lastVisibleTransaction:doc
              })
        })
    }else if(enteredtext[0].toUpperCase()==="S"){
        const transaction=await db.collection("transaction").where("studentId","==",text).get()
        transaction.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions, doc.data()],
                lastVisibleTransaction:doc
              })
        })
    }
    }
    render() {
        return(
         <View style={styles.container}>
         <View style={styles.searchBar}>
             <TextInput style={styles.bar}
             placeholder="Enter bookid or studentid"
             onChangeText={(text)=>{
                 this.setState({
                     search:text
                 })
             }}/>
             <TouchableOpacity style={styles.searchbutton} onPress={()=>{this.searchTransactions(this.state.search)}}>
             <Text>Search</Text>
             </TouchableOpacity>
         </View>
         <FlatList
             data={this.state.allTransactions}
             renderItem={({item})=>(
                <View style={{borderBottomWidth:2}}>
                       <Text>{"bookId: "+item.bookId}</Text>
                       <Text>{"studentID: "+item.studentId}</Text>
                       <Text>{"transactionType: "+item.transactionType}</Text>
                </View>
             )}
             keyExtractor={(item,index)=>index.toString()}
             onEndReached={this.fetchMoreTransactions()}
             onEndReachedThreshold={0.7} 
         />
         </View>
        )
    }
}
const styles=StyleSheet.create({
    container:{
        flex:1,
        marginTop:20
    },
    searchBar:{
        flexDirection:"row",
        height:40,
        width:"auto",
        borderWidth:0.5,
        alignItems:"center",
        backgroundColor:"grey"
    },
    bar:{
        borderWidth:2,
        height:30,
        width:300,
        paddingLeft:10
    },
    searchbutton:{
        borderWidth:1,
        height:30,
        width:50,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"green"
    }
})
  