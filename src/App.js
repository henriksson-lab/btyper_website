//import logo from './logo.svg';
import './App.css';

import React from 'react';
import * as ReactDOM from 'react-dom/client';

//import { streamSaver } from 'streamsaver'
//const streamSaver = require('streamsaver')
//const streamSaver = window.streamSaver


/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
class SearchField extends React.Component {

  constructor(props) {
    super(props);
    this.fieldmeta = props.fieldmeta;
    this.dict_fieldmeta = Object.fromEntries(props.fieldmeta.map(x => [x.column_id, x]));

    this.handleDeleteCB=props.handleDelete;
    this.handleChangeCB=props.handleChange;

    this.handleChange = this.handleChange.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.getQuery = this.getQuery.bind(this);
  }

  getQuery(){
    return this.state;
  }


  handleDelete(event) {
    this.handleDeleteCB(this.props.id);
  }

  handleChange(event) {
    const target = event.target;
    var state = {
        field: this.props.field,
        value: this.props.value,
        value2: this.props.value2,
        id: this.props.id
    };
    if(target.name==="selectfield"){
      state.field = event.target.value;
      var fieldmeta = this.dict_fieldmeta[state.field];
      state.value = fieldmeta.v1;
      state.value2 = fieldmeta.v2;
    } else if(target.name==="value"){
      state.value = event.target.value;
    } else if(target.name==="value2"){
      state.value2 = event.target.value
    }
    this.handleChangeCB(state);
  }



  render() {
    var state = {
        field: this.props.field,
        value: this.props.value,
        value2: this.props.value2,
        id: this.props.id
    };
    var inputfield=[];

    var current_fieldmeta = this.dict_fieldmeta[state.field];
    if(current_fieldmeta.column_type==="text"){
      inputfield.push((<label>
        {'\u00A0'} is: <input type="text" value={state.value} onChange={this.handleChange} name="value"/>
      </label>));
    } else if(current_fieldmeta.column_type==="number"){
      inputfield.push((<label>
        {'\u00A0'} From: <input type="text" value={state.value} onChange={this.handleChange} name="value"/>
        {'\u00A0'} To:   <input type="text" value={state.value2} onChange={this.handleChange} name="value2"/>
      </label>));
    }

    var html = (
        <div className="divSearchField">
          <button onClick={this.handleDelete} name="bDelete" className="buttonspacer">X</button>
          <select value={state.field} onChange={this.handleChange} name="selectfield">
                {
                    this.fieldmeta.map((item, index) => (
                        <option value={item.column_id} key={state.id+"--"+index }>{item.column_id}</option>
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
    this.state = {
        fields : []
    };

    this.search_callback=props.search_callback;

    this.fieldmeta = null;
    this.dict_fieldmeta = {};
    this.nextkey = 1;

    this.handleAddFilter = this.handleAddFilter.bind(this);
    this.addFilterNamed = this.addFilterNamed.bind(this);
    this.handleSearch = this.handleSearch.bind(this);

    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.handleFieldDelete = this.handleFieldDelete.bind(this);

  }

  componentDidMount() {
      fetch('rest/column_desc')
          .then((response) => response.json())
          .then((responseJson) => {
            this.fieldmeta = responseJson;
            this.dict_fieldmeta = Object.fromEntries(this.fieldmeta.map(x => [x.column_id, x]));

            if(this.state.fields.length===0){
                this.addFilterNamed([
                    "strain",
                    "N50",
                    "Completeness",
                    "Contamination"
                ]);
            }
          })
          .catch((error) => {
            console.error(error);
          });
  }

  handleFieldDelete(id){
    this.setState({
      fields: this.state.fields.filter((e) => e.id !== id)
    });
  }

  handleFieldChange(newfield){
        this.setState({
          fields: this.state.fields.map((e) => e.id===newfield.id ? newfield : e)
        });
  }

  addFilterNamed(list_column_id) {
    var newfields = list_column_id.map((column_id) => {
        const newkey=this.nextkey++;
        var current_fieldmeta = this.dict_fieldmeta[column_id];
        return({
          field:column_id,
          value: current_fieldmeta.v1,
          value2: current_fieldmeta.v2,
          id: newkey
        });
    });

    this.setState({fields: this.state.fields.concat(newfields)});
  }


  handleAddFilter() {
    this.addFilterNamed(["strain"]);
  }

  handleSearch() {
    this.search_callback(this.state.fields);
  }

  render() {
    return (
      <div>
        <div>
          {this.state.fields.map((field) => (
            <SearchField
                  field={field. field}
                  value={field.value}
                  value2={field.value2}
                  key={field.id}
                  id={field.id}
                  handleDelete={this.handleFieldDelete}
                  handleChange={this.handleFieldChange}
                  fieldmeta={this.fieldmeta}
            />
          ))}
        </div>
        <button className="buttonspacer" onClick={this.handleAddFilter}>Add filter</button>
        <button className="buttonspacer" onClick={this.handleSearch}>Search</button>
      </div>
    );
  }
}




/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
class TheTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      straindata: null,
      selected: []
    };

    this.handleFastaAll = this.handleFastaAll.bind(this);
    this.handleFastaSelected = this.handleFastaSelected.bind(this);
    this.handleStrainlistAll = this.handleStrainlistAll.bind(this);
    this.handleStrainlistSelected = this.handleStrainlistSelected.bind(this);
    this.asynchUpdate = this.asynchUpdate.bind(this);
    this.handleChangeSelected = this.handleChangeSelected.bind(this);
  }

  componentDidMount() {
    // HACK: streamsaver references window which is undefined on SSR. Ensure library is only loaded on client
    try {
      this.streamSaver = require('streamsaver');
      if (!this.streamSaver.WritableStream) {
        this.streamSaver.WritableStream = require('web-streams-polyfill/ponyfill').WritableStream;
      }
    } catch (e) {
      console.error(e);
    }
  }


  componentDidUpdate(prevProps, prevState) {
    if(prevProps.query!==this.props.query){
      this.asynchUpdate();
    }
  }

  asynchUpdate(){
    var query = this.props.query;
      fetch('rest/straindata', {method: 'POST', headers: {'Content-Type': 'application/json'}, body:JSON.stringify(query)})
          .then((response) => response.json())
          .then((responseJson) => {
            this.setState({
              straindata: responseJson,
              query: query
            })
          })
          .catch((error) => {
            console.error(error);
          });
  }



  downloadFasta(listFasta){
    const fileStream = this.streamSaver.createWriteStream('fasta.zip');
    // from view-source:https://jimmywarting.github.io/StreamSaver.js/examples/fetch.html
    var query={}
    fetch(
        'rest/getfasta',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(query)
    }).then(res => {
          const readableStream = res.body
          if (window.WritableStream && readableStream.pipeTo) {
            return readableStream.pipeTo(fileStream)
              .then(() => console.log('done writing'))
          }
          window.writer = fileStream.getWriter()
          const reader = res.body.getReader()
          const pump = () => reader.read()
            .then(res => res.done
              ? window.writer.close()
              : window.writer.write(res.value).then(pump))
          pump()
    })
  }

  downloadIdList(listFasta){
    // from view-source:https://jimmywarting.github.io/StreamSaver.js/examples/fetch.html
    const fileStream = this.streamSaver.createWriteStream('listid.txt');
    const inp=listFasta.join("\n");
    const readableStream = new Response(inp).body;
    if (window.WritableStream && readableStream.pipeTo) {
    return readableStream.pipeTo(fileStream)
      .then(() => console.log('done writing'))
    }
    window.writer = fileStream.getWriter()
    const reader = new Response(inp).body.getReader()
    const pump = () => reader.read()
    .then(res => res.done
      ? window.writer.close()
      : window.writer.write(res.value).then(pump))
    pump()
  }

  handleFastaAll(){
      if(this.state.straindata!==null){
          var listStrains = this.state.straindata.strain.values();
          this.downloadFasta(listStrains);
      } else {
        console.log("not ready to download yet");
      }
  }

  handleFastaSelected(){
      var listStrains=this.state.selected;
      if(listStrains.length==0){
          alert("No strains selected");
      } else {
          this.downloadFasta(listStrains);
      }
  }


  handleStrainlistAll(){
      if(this.state.straindata!==null){
          var listStrains = Object.values(this.state.straindata.strain);
          this.downloadIdList(listStrains);
      } else {
        console.log("not ready to download yet");
      }
  }


  handleStrainlistSelected(){
      var listStrains=this.state.selected;
      if(listStrains.length==0){
          alert("No strains selected");
      } else {
          this.downloadIdList(listStrains);
      }
  }


  handleChangeSelected(event) {
      const target = event.target;
      var updatedList = [...this.state.selected];
      if (event.target.checked) {
            updatedList = [...this.state.selected, event.target.value];
      } else {
            updatedList.splice(this.state.selected.indexOf(event.target.value), 1);
      }
      this.setState({selected: updatedList});
  }



  render() {

    var straindata = this.state.straindata;
    if(this.props.query==null){
        return "Data will appear here after searching";
    }
    if(!straindata){
       return "Loading data...";
    }
    if(straindata.length===0){
       return "No data to show"
    }

    var colnames=Object.keys(straindata);

//    var num_rows = straindata["column_id"].length;
    var num_rows = Object.keys(straindata["strain"]).length;  //ugly. should not have row indices on each entry
    var row_nums = Array.from(Array(num_rows).keys())

    var fieldid=0;

    var set_selected=this.state.selected

    return (
      <div>
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
                   <td key={fieldid++}>
                       <input
                           type="checkbox" key={fieldid++}
                           onChange={this.handleChangeSelected}
                           checked={this.state.selected.includes(straindata["strain"][row_i])}
                           value={straindata["strain"][row_i]}
                       />
                   </td>
                   {colnames.map(cname => (
                        <td key={fieldid++}>
                            {straindata[cname][row_i]}
                        </td>)
                   )}
                 </tr>)
          )}
        </tbody>
      </table>
      </div>
    );
  }
}



/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
        query:null
    }
    this.handleSearch = this.handleSearch.bind(this);
  }

  handleSearch(q){
    this.setState({query:q});
  }




  render() {
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
          <SearchForm search_callback={this.handleSearch}/>
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
        <div className="divtable" id="divfortable">
          <TheTable query={this.state.query} />
        </div>
      </div>
    );
  }
}

//straindata={this.state.straindata}

export default App;
