import React, { Component, SyntheticEvent } from 'react';
import '../index.css';
import firebase from "firebase/app";
import "firebase/database";
import {

  FirebaseDatabaseMutation,
  FirebaseDatabaseNode
} from "@react-firebase/database";
import { Alert } from 'reactstrap';

enum Mutation {
    ADD, 
    SUB,
    MUL,
    DIV,
    LEFTB,
    RIGHTB
}

class MutationWrapper {
    private _mutation? : Mutation;
    
    get mutation(): Mutation {
        return this._mutation as Mutation;
    }
    
    private _func? : (a : number, b : number) => number | null

    get func():  (a : number, b : number) => number {
        return this._func as  (a : number, b : number) => number;
    }
    
    private _str? : string;

    get str(): string {
        return this._str as string;
    }
    
    constructor(mutation :  Mutation) {
        this._mutation = mutation
        this.init(mutation)
    }   

    private init(mutation : Mutation) : void{
        switch(mutation) {
            case Mutation.ADD : {
                this._func = (a, b) => a + b;
                this._str = "+";
                break;
            }
            case Mutation.SUB : {
                this._func = (a, b) => a - b;
                this._str = "-";
                break;
            }
            case Mutation.MUL : {
                this._func = (a, b) => a * b;
                this._str = "*";
                break;
            }
            case Mutation.DIV : {
                this._func = (a, b) => a / b;
                this._str = "/";
                break;
            }
            case Mutation.LEFTB : {
                this._func = (a, b) => null;
                this._str = "(";
                break;
            }
            case Mutation.RIGHTB : {
                this._func = (a, b) => null;
                this._str = ")";
                break;
            }
        }
    }
}
type Record = {
    key? : string;
    timestamp : number;
    equation : string;
    result : number
}

type CalculatorState = {
    inputStr : string;
    latestInputStr? : string;
    error? : Error | null;
    pushedRecord? : Record
    shouldPush : boolean
}

class Calculator extends Component<{}, CalculatorState> {
    state: Readonly<CalculatorState> = {
        inputStr : "",
        latestInputStr : "",
        error : null,
        shouldPush : false
    };

    handleNumberClick(item: React.MouseEvent<HTMLButtonElement>) {
        item.preventDefault()
        let digit : string = item.currentTarget.textContent as string;
        if (digit) {
            this.setState((prevState, props) => ({
                inputStr: prevState.inputStr + digit
            }), () => {
                console.log(this.state)
            })
        }
    }

    handleMutationClick(item: MutationWrapper) {
        let predicate =  item.mutation === Mutation.LEFTB
                                || item.mutation === Mutation.RIGHTB
        if (this.state.inputStr || predicate) {
            let mut = ['+', '-', '*', '/']
            let length = this.state.inputStr.length
            let latestStr = this.state.inputStr[length - 1]
    
            if (!mut.includes(latestStr) || predicate) {
                this.setState((prevState, props) => ({
                    inputStr: prevState.inputStr + item.str
                }), () => {
                    console.log(this.state)
                })
            }
        }
    }

    handleRmClick() {
        let prevStr = this.state.inputStr
        if (prevStr) {
            this.setState((prevState, props) => ({
                inputStr: prevStr.length > 1 ?
                          prevStr.substring(0, prevStr.length - 1)
                          : ""
            }), () => {
                console.log(this.state)
            })
        }
    }

    handleClearClick() {
        this.setState({
            inputStr : ""
        })
    }

    handleEqClick() {
        let res = ''
        try {
         res = eval(this.state.inputStr) as string
        
            this.setState({
                inputStr : res,
                latestInputStr : this.state.inputStr,
                error : null,
                shouldPush: true
            }, () => {
                console.log("state after eq : " + this.state.shouldPush)
            })
        } catch (e) {
            console.log("ERRORR")
            this.setState({
                error : e
            })
        }
    }

    render() {
        return (<>
            <div className="container">
                <div className={this.state.error ? "input-error" : "input-wrapper"}>
                <input type="text" required disabled={false} value={this.state.inputStr}/>
                </div>
                <div className="calc">
                    <div className="calc-item"></div>
                    <div className="calc-item" onClick={() => this.handleMutationClick(new MutationWrapper(Mutation.LEFTB))}>(</div>
                    <div className="calc-item" onClick={() => this.handleMutationClick(new MutationWrapper(Mutation.RIGHTB))}>)</div>
                    <div className="calc-item calc-op"
                    onClick={() => this.handleMutationClick(new MutationWrapper(Mutation.ADD))}>+
                    </div>
                    {
                    [1, 2, 3].map((it) => {
                        return <button className="calc-item" onClick={this.handleNumberClick.bind(this)}>
                            {`${it}`}</button>
                    })
                    }
                    <div className="calc-item calc-op"
                    onClick={() => this.handleMutationClick(new MutationWrapper(Mutation.SUB))}>-
                    </div>
                    {
                    [4, 5, 6].map((it) => {
                        return <button className="calc-item" onClick={this.handleNumberClick.bind(this)}>
                            {`${it}`}</button>
                    })
                    }
                    <div className="calc-item calc-op"
                    onClick={() => this.handleMutationClick(new MutationWrapper(Mutation.MUL))}>*
                    </div>
                    {
                    [7, 8, 9].map((it) => {
                        return <button className="calc-item" onClick={this.handleNumberClick.bind(this)}>
                            {`${it}`}</button>
                    })
                    }
                    <div className="calc-item calc-op"
                    onClick={() => this.handleMutationClick(new MutationWrapper(Mutation.DIV))}>/
                    </div>
                    <button className="calc-item" onClick={this.handleNumberClick.bind(this)}> 0</button>
                    <button className="calc-item calc-op" onClick={this.handleClearClick.bind(this)}>C</button>
                    <div className="calc-item calc-op" onClick={this.handleRmClick.bind(this)}>DEL</div>
                    <div className="calc-item calc-op" onClick = {this.handleEqClick.bind(this)}>=</div> 
                </div>
                <FirebaseDatabaseMutation type="push" path={"records/saved-records"}>
                    {({ runMutation }) => {
                        return (
                            <button
                            className="push-btn"
                            //disabled={this.state.shouldPush === false ? true : false}
                            onClick={async () => {
                                const record : Record = {
                                    timestamp: Date.now(),
                                    equation : this.state.latestInputStr as string,
                                    result : +this.state.inputStr
                                }

                                const { key } = await runMutation(record);
                                record.key = key as string
                                this.setState({pushedRecord : record, shouldPush : false})
                            }}>
                            Push
                            </button>
                        );
                    }}
                </FirebaseDatabaseMutation>   
                <div className="alert-scs" hidden={this.state.pushedRecord ? false : true}>
                    {`Record pushed :` +
                    `\nKey ${this.state.pushedRecord?.key}\n` +
                    `\nTimestamp  ${this.state.pushedRecord?.timestamp}`}
                </div>      
        </div>
        </>)
    }
}

export default Calculator;