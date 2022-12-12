//import logo from './logo.svg';
import './App.css';

import React from 'react';


/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
class SearchField extends React.Component {

  constructor(props, fieldmeta) {
    super(props);
    this.fieldmeta = fieldmeta
//    this.fieldmeta = []
    this.state = {field: props.field, value: props.value};

//    this.handleChange = this.handleChange.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleChangeValue = this.handleChangeValue.bind(this);
  }

  handleChangeField(event) {
    var newstate = this.state;
    newstate.field = event.target.value;
    this.setState(newstate);
  }

  handleChangeValue(event) {
    var newstate = this.state;
    newstate.value = event.target.value;
    this.setState(newstate);
  }


  render() {
    var html = (
        <label>
          <button>X</button>
          <select value={this.state.field} onChange={this.handleChangeField}>
                {
                    this.fieldmeta.map((item, index) => (
                        <option value={item.column_id} key={this.key+"--"+index }>{item.column_id}</option>
                    ))
                }
          </select>
          <input type="text" value={this.state.value} onChange={this.handleChangeValue} />
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
              fields:[new SearchField({field:"sample", value:"", key:this.nextkey++}, this.fieldmeta)]
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
    alert('A name was submitted: ' + this.state.value);
    event.preventDefault();
  }

  render() {
////////////////////////// key missing??
    return (
      <form onSubmit={this.handleSubmit}>
        <div>
        { this.state.fields.map((item) => item.render()) }
        </div>
        <input type="submit" value="Submit" />
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

            //console.log(responseJson)

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

    if(straindata.length==0){
       straindata={"column_id":[]}
    }

    var colnames=Object.keys(straindata);

    function getrow(row_i){
      return (<tr>{colnames.map(cname => (<td>{straindata[cname][row_i]}</td>))}</tr>);
    }

//    var num_rows = straindata["column_id"].length;
    var num_rows = Object.keys(straindata["column_id"]).length;  //ugly. should not have row indices on each entry
    var row_nums = Array.from(Array(num_rows).keys())

    return (
      <table>
        <thead>
          <tr>
            {colnames.map(cname => (<td>{cname}</td>))}
          </tr>
        </thead>
        <tbody>
          {row_nums.map(row_i => getrow(row_i))}
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
        <SearchForm/>
        <TheTable/>
      </header>


    </div>
  );
}


export default App;
