import React from 'react';
import "./css/styles.css"
import Calculator from './components/Calculator';
import firebase from "firebase/app";
import {
  FirebaseDatabaseProvider
} from "@react-firebase/database";
import { config } from "./config/db-config";

function App() {
  return (
    <div className="app">
         <FirebaseDatabaseProvider
          firebase={firebase} {...config}>
             <Calculator/>
         </FirebaseDatabaseProvider>
     
    </div>
  );
}

export default App;
