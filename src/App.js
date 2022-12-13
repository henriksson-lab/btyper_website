//import logo from './logo.svg';
import './App.css';

import React from 'react';


/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
class SearchField extends React.Component {

  constructor(props) {
    super(props);
    this.fieldmeta = props.fieldmeta;
    this.searchform = props.searchform;
    this.dict_fieldmeta = Object.fromEntries(props.fieldmeta.map(x => [x.column_id, x]));

    //TODO. look up the standard values here
    var current_fieldmeta = this.dict_fieldmeta[props.field];
////


    this.state = {field: props.field, value: props.value, value2: props.value2, id: props.id};
    this.handleChange = this.handleChange.bind(this);
    this.handleDelete = this.handleDelete.bind(this);

    this.searchform.field_components.push(this);
  }

  handleDelete(event) {
    const ind=this.searchform.state.fields.findIndex(e => e.key===""+this.state.id);
    this.searchform.state.fields.splice(ind,1);
    this.searchform.field_components.filter(e => e.state.id != this.state.id);
    this.searchform.setState({fields: this.searchform.state.fields});
  }

  handleChange(event) {
    const target = event.target;
    if(target.name==="selectfield"){
      this.setState({field:event.target.value});
    } else if(target.name==="value"){
      this.setState({value:event.target.value});
    } else if(target.name==="value2"){
      this.setState({value2:event.target.value2});
    }
  }



  render() {
    var inputfield=[];

    var current_fieldmeta = this.dict_fieldmeta[this.state.field];
    if(current_fieldmeta.column_type==="text"){
      inputfield.push((<label>
        {'\u00A0'} is: <input type="text" value={this.state.value} onChange={this.handleChange} name="value"/>
      </label>));
    } else if(current_fieldmeta.column_type==="number"){
      inputfield.push((<label>
        {'\u00A0'} From: <input type="text" value={this.state.value} onChange={this.handleChange} name="value"/>
        {'\u00A0'} To:   <input type="text" value={this.state.value2} onChange={this.handleChange} name="value2"/>
      </label>));
    }

    var html = (
        <div className="divSearchField">
          <button onClick={this.handleDelete} name="bDelete" className="buttonspacer">X</button>
          <select value={this.state.field} onChange={this.handleChange} name="selectfield">
                {
                    this.fieldmeta.map((item, index) => (
                        <option value={item.column_id} key={this.key+"--"+index }>{item.column_id}</option>
                    ))
                }
          </select>
          {inputfield}
        </div>
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
    this.dict_fieldmeta = {};
    this.nextkey = 1;

    this.field_components = [];

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.addFilter = this.addFilter.bind(this);
    this.addFilterNamed = this.addFilterNamed.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  componentDidMount() {
      fetch('rest/column_desc')
          .then((response) => response.json())
          .then((responseJson) => {
            //console.log(responseJson)
            this.fieldmeta = responseJson;
            this.dict_fieldmeta = Object.fromEntries(this.fieldmeta.map(x => [x.column_id, x]));

            this.state.fields=[];
            this.addFilterNamed("strain");
            this.addFilterNamed("N50");
            this.addFilterNamed("Completeness");
            this.addFilterNamed("Contamination");
          })
          .catch((error) => {
            console.error(error);
          });
  }

  addFilterNamed(column_id) {
    var curfields = this.state.fields;
    const newkey=this.nextkey++;
    var current_fieldmeta = this.dict_fieldmeta[column_id];
    curfields.push(
                (<SearchField field={column_id} value={current_fieldmeta.v1} value2={current_fieldmeta.v2} key={newkey} id={newkey} fieldmeta={this.fieldmeta} searchform={this}/>)
    );
    this.setState({fields:curfields});
  }


  addFilter() {
    this.addFilterNamed("strain");
  }

  handleSearch() {
console.log("search");
     //Collect data from each entry TODO


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
        <button className="buttonspacer" onClick={this.addFilter}>Add filter</button>
        <button className="buttonspacer" onClick={this.handleSearch}>Search</button>
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


    this.handleFastaAll = this.handleFastaAll.bind(this);
    this.handleFastaSelected = this.handleFastaSelected.bind(this);
    this.handleStrainlistAll = this.handleStrainlistAll.bind(this);
    this.handleStrainlistSelected = this.handleStrainlistSelected.bind(this);

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


  handleFastaAll(){
  }
  handleFastaSelected(){
  }
  handleStrainlistAll(){
  }
  handleStrainlistSelected(){
  }

  render() {

    var straindata = this.state.straindata;
    //console.log(straindata);

    if(straindata.length===0){
       straindata={"strain":[]}
    }

    var colnames=Object.keys(straindata);

//    var num_rows = straindata["column_id"].length;
    var num_rows = Object.keys(straindata["strain"]).length;  //ugly. should not have row indices on each entry
    var row_nums = Array.from(Array(num_rows).keys())

    var fieldid=0;

    return (
      <form>
      <button name="bFastaAll" className="buttonspacer" onClick={this.handleFastaAll}>Download all FASTA</button>
      <button name="bFastaSelected" className="buttonspacer" onClick={this.handleFastaSelected}>Download selected FASTA</button>
      <button name="bStrainlistAll" className="buttonspacer" onClick={this.handleStrainlistAll}>Download list of all strains</button>
      <button name="bStrainlistSelected" className="buttonspacer" onClick={this.handleStrainlistSelected}>Download list of selected strains</button>
      <table>
        <thead>
          <tr>
            <th/>
            {colnames.map(cname => (<th key={fieldid++}>{cname}</th>))}
          </tr>
        </thead>
        <tbody>
          {row_nums.map(row_i =>
                (<tr key={fieldid++}>
                   <td key={fieldid++}><input type="checkbox" key={fieldid++}/></td>
                   {colnames.map(cname => (<td key={fieldid++}>{straindata[cname][row_i]}</td>))}
                 </tr>)
          )}
        </tbody>
      </table>
      </form>
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
      <div className="withspacer">
        <SearchForm/>
      </div>
      <div className="App-divider">
        Strains across the world
      </div>
      <div className="withspacer">
          Map here
      </div>
      <div className="App-divider">
        Entries
      </div>
      <div className="divtable">
        <TheTable/>
      </div>
    </div>
  );
}




export default App;
