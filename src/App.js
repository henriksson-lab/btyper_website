//import logo from './logo.svg';
import './App.css';

import React from 'react';


/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
class SearchField extends React.Component {

  constructor(props, fieldmeta) {
    super(props);
    this.fieldmeta = props.fieldmeta;
//    this.fieldmeta = []
    this.state = {field: props.field, value: props.value};

//    this.handleChange = this.handleChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    const target = event.target;
//    var partialstate = {}; //this.state;
    if(target.name==="delete"){}
    else if(target.name==="selectfield"){
//      partialstate["field"] = event.target.value;
      this.setState({field:event.target.value});
    } else if(target.name==="value"){
  //    partialstate["value"] = event.target.value;
      this.setState({value:event.target.value});
    }

  }



  render() {
    var html = (
        <label>
          <button onChange={this.handleChange} name="delete">X</button>
          <select value={this.state.field} onChange={this.handleChange} name="selectfield">
                {
                    this.fieldmeta.map((item, index) => (
                        <option value={item.column_id} key={this.key+"--"+index }>{item.column_id}</option>
                    ))
                }
          </select>
          <input type="text" value={this.state.value} onChange={this.handleChange} name="value"/>
        </label>
    );
    return html;
  }
}




/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
class SearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: '', fields : []};

    this.fieldmeta = null;
    this.nextkey = 1;

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
      fetch('rest/column_desc')
          .then((response) => response.json())
          .then((responseJson) => {
            //console.log(responseJson)
            this.fieldmeta = responseJson;
            this.setState({
              value:"",
              fields:[(<SearchField field="sample" value="xxx" key={this.nextkey++} fieldmeta={this.fieldmeta}/>)]
            })
          })
          .catch((error) => {
            console.error(error);
          });
  }



  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
//    alert('A name was submitted: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div>
        { this.state.fields }
        </div>
        <input type="submit" value="Add filter" />
        <input type="submit" value="Search" />
      </form>
    );
  }
}




/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
class TheTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {straindata: []};
  }

  componentDidMount() {
      fetch('rest/straindata')
          .then((response) => response.json())
          .then((responseJson) => {
            this.setState({
              straindata:responseJson
            })
          })
          .catch((error) => {
            console.error(error);
          });
  }



  render() {

    var straindata = this.state.straindata;
    //console.log(straindata);

    if(straindata.length===0){
       straindata={"column_id":[]}
    }

    var colnames=Object.keys(straindata);

//    var num_rows = straindata["column_id"].length;
    var num_rows = Object.keys(straindata["column_id"]).length;  //ugly. should not have row indices on each entry
    var row_nums = Array.from(Array(num_rows).keys())

    var fieldid=0;

    return (
      <table>
        <thead>
          <tr>
            {colnames.map(cname => (<td key={fieldid++}>{cname}</td>))}
          </tr>
        </thead>
        <tbody>
          {row_nums.map(row_i =>
                (<tr key={fieldid++}>{colnames.map(cname => (<td key={fieldid++}>{straindata[cname][row_i]}</td>))}</tr>)
          )}
        </tbody>
      </table>
    );
  }
}





/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
function App() {

  return (
    <div className="App">
      <header className="App-header">
        <p>
          BTyper - by Carroll lab
        </p>
      </header>
      <div className="App-divider">
        Filter strains
      </div>
        <SearchForm/>
      <div className="App-divider">
        Strains across the world
      </div>
       Map here
      <div className="App-divider">
        Entries
      </div>
        <TheTable/>
<SearchField field="bar" value="xxx" fieldmeta={[{column_id:"bar"},{column_id:"whee"}]}/>
    </div>
  );
}


export default App;
