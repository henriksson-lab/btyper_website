//import logo from './logo.svg';
import './App.css';

import React from 'react';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import PieChart from "highcharts-react-official";
import mapDataWorld from './world-palestine-lowres';

// Load Highcharts modules
require('highcharts/modules/map')(Highcharts);



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
        column_type: this.props.column_type,
        id: this.props.id
    };
    if(target.name==="selectfield"){
      state.field = event.target.value;
      var fieldmeta = this.dict_fieldmeta[state.field];
      state.value = fieldmeta.v1;
      state.value2 = fieldmeta.v2;
      state.column_type = fieldmeta.column_type;
    } else if(target.name==="value"){
      state.value = event.target.value;
    } else if(target.name==="value2"){
      state.value2 = event.target.value
    }

    console.log("new");
    console.log(state);
    console.log(this.dict_fieldmeta);
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
        {'\u00A0'} From: <input type="text" value={state.value}  onChange={this.handleChange} name="value"/>
        {'\u00A0'} To:   <input type="text" value={state.value2} onChange={this.handleChange} name="value2"/>
      </label>));
    }

    var html = (
        <div className="divSearchField">
          <button onClick={this.handleDelete} name="bDelete" className="buttonspacer">X</button>
          <select value={state.field} onChange={this.handleChange} name="selectfield">
                {
                    this.fieldmeta.map((item, index) => (
                        <option value={item.column_id} key={state.id+"--"+index}>{item.column_id}</option>
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
          field: column_id,
          value: current_fieldmeta.v1,
          value2: current_fieldmeta.v2,
          column_type: current_fieldmeta.column_type,
          id: newkey
        });
    });

    this.setState({fields: this.state.fields.concat(newfields)});
  }


  handleAddFilter() {
    this.addFilterNamed(["strain"]);
  }

  handleSearch() {
  console.log(this.state.fields);
    this.search_callback(this.state.fields);
  }

  render() {
    return (
      <div>
        <div>
          {this.state.fields.map((field) => (
            <SearchField
                  field={field.field}
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
      //query: props.query,
      //straindata: props.straindata,
      selected: []
    };

    this.handleFastaAll = this.handleFastaAll.bind(this);
    this.handleFastaSelected = this.handleFastaSelected.bind(this);
    this.handleStrainlistAll = this.handleStrainlistAll.bind(this);
    this.handleStrainlistSelected = this.handleStrainlistSelected.bind(this);
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
          var listStrains = Object.values(this.state.straindata.strain);
          this.downloadFasta(listStrains);
      } else {
        console.log("not ready to download yet");
      }
  }

  handleFastaSelected(){
      var listStrains=this.state.selected;
      if(listStrains.length===0){
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
      if(listStrains.length===0){
          alert("No strains selected");
      } else {
          this.downloadIdList(listStrains);
      }
  }


  handleChangeSelected(event) {
      var updatedList = [...this.state.selected];
      if (event.target.checked) {
            updatedList = [...this.state.selected, event.target.value];
      } else {
            updatedList.splice(this.state.selected.indexOf(event.target.value), 1);
      }
      this.setState({selected: updatedList});
  }



  render() {
    var straindata = this.props.straindata;
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
class TheMap extends React.Component {
  constructor(props) {
    super(props);

    this.data = [
            ['gl', 10], ['sh', 11], ['bu', 12], ['lk', 13], ['as', 14], ['dk', 15],
        ['fo', 16], ['gu', 17], ['mp', 18], ['pr', 19], ['um', 20], ['us', 21],
        ['vi', 22], ['ca', 23], ['st', 24], ['jp', 25], ['cv', 26], ['dm', 27],
        ['sc', 28], ['jm', 29], ['ws', 30], ['om', 31], ['vc', 32], ['sb', 33],
        ['lc', 34], ['fr', 35], ['nr', 36], ['no', 37], ['fm', 38], ['kn', 39],
        ['cn', 40], ['bh', 41], ['to', 42], ['id', 43], ['mu', 44], ['tt', 45],
        ['sw', 46], ['bs', 47], ['pw', 48], ['tv', 49], ['mh', 50], ['cl', 51],
        ['ki', 52], ['ph', 53], ['th', 54], ['gd', 55], ['ag', 56], ['es', 57],
        ['bb', 58], ['it', 59], ['mt', 60], ['mv', 61], ['sp', 62], ['pg', 63],
        ['sg', 64], ['cnm', 65], ['gb', 66], ['cy', 67], ['gr', 68], ['km', 69],
        ['fj', 70], ['ru', 71], ['va', 72], ['sm', 73], ['az', 74], ['ls', 75],
        ['tj', 76], ['ml', 77], ['dz', 78], ['tw', 79], ['kz', 80], ['kg', 81],
        ['uz', 82], ['tz', 83], ['ar', 84], ['sa', 85], ['nl', 86], ['ye', 87],
        ['ae', 88], ['in', 89], ['tr', 90], ['bd', 91], ['ch', 92], ['sr', 93],
        ['pt', 94], ['my', 95], ['kh', 96], ['vn', 97], ['br', 98], ['pa', 99],
        ['ng', 100], ['ir', 101], ['ht', 102], ['do', 103], ['sl', 104],
        ['gw', 105], ['ba', 106], ['hr', 107], ['ee', 108], ['mx', 109],
        ['tn', 110], ['kw', 111], ['de', 112], ['mm', 113], ['gq', 114],
        ['ga', 115], ['ie', 116], ['pl', 117], ['lt', 118], ['eg', 119],
        ['ug', 120], ['cd', 121], ['am', 122], ['mk', 123], ['al', 124],
        ['cm', 125], ['bj', 126], ['nc', 127], ['ge', 128], ['tl', 129],
        ['tm', 130], ['pe', 131], ['mw', 132], ['mn', 133], ['ao', 134],
        ['mz', 135], ['za', 136], ['cr', 137], ['sv', 138], ['bz', 139],
        ['co', 140], ['ec', 141], ['ly', 142], ['sd', 143], ['kp', 144],
        ['kr', 145], ['gy', 146], ['hn', 147], ['ni', 148], ['et', 149],
        ['so', 150], ['gh', 151], ['si', 152], ['gt', 153], ['jo', 154],
        ['we', 155], ['il', 156], ['zm', 157], ['mc', 158], ['uy', 159],
        ['rw', 160], ['bo', 161], ['cg', 162], ['eh', 163], ['rs', 164],
        ['me', 165], ['tg', 166], ['la', 167], ['af', 168], ['jk', 169],
        ['pk', 170], ['bg', 171], ['ua', 172], ['ro', 173], ['qa', 174],
        ['li', 175], ['at', 176], ['sz', 177], ['hu', 178], ['ne', 179],
        ['lu', 180], ['ad', 181], ['ci', 182], ['lr', 183], ['bn', 184],
        ['mr', 185], ['be', 186], ['iq', 187], ['gm', 188], ['ma', 189],
        ['td', 190], ['kv', 191], ['lb', 192], ['sx', 193], ['dj', 194],
        ['er', 195], ['bi', 196], ['sn', 197], ['gn', 198], ['zw', 199],
        ['py', 200], ['by', 201], ['lv', 202], ['sy', 203], ['na', 204],
        ['bf', 205], ['ss', 206], ['cf', 207], ['md', 208], ['gz', 209],
        ['ke', 210], ['cz', 211], ['sk', 212], ['vu', 213], ['nz', 214],
        ['cu', 215], ['fi', 216], ['se', 217], ['au', 218], ['mg', 219],
        ['ve', 220], ['is', 221], ['bw', 222], ['bt', 223], ['np', 224],
    ];
  }


  render() {
    const mapOptions = {
      title: {
        text: ''
      },
      colorAxis: {
        min: 0,
        stops: [[0.4, '#ffff00'], [0.65, '#bfff00'], [1, '	#40ff00']]
      },

      series: [
        {
          mapData: mapDataWorld,
          name: 'Asia',
          data: this.data
        }
      ]
    };



    var forindex="GTDB_Species";

    var pie_data = [];
    var values = this.props.straindata;
    if(values!==null && forindex in values){
        let uniqueItems = [...new Set(Object.values(values[forindex]))]
        var countItem={};
        for (const e of uniqueItems) {
            countItem[e]=0;
        }
        for (const e of Object.values(values[forindex])) {
            countItem[e]=countItem[e]+1;
        }
        for (const [key, value] of Object.entries(countItem)) {
            pie_data.push({
              name: key,
              y: value//,
              //sliced: true
            });
        }
    }


    const pieOptions = {
      chart: {
        type: "pie"
      },
      title: {
        text: ""
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: false
          },
          showInLegend: false
        }
      },
      series: [
        {
          name: "",
          color: "#006600",
          lineWidth: 1,
          marker: {
            enabled: false,
            symbol: "circle",
            radius: 3,
            states: {
              hover: {
                enabled: true,
                lineWidth: 1
              }
            }
          },
          data: pie_data
        }
      ]
    };


    return (
      <div style={{display:"flex"}}>
          <div style={{width:"40%", float:"left"}}>
              <HighchartsReact
                  options={mapOptions}
                  constructorType={'mapChart'}
                  highcharts={Highcharts}
                />
          </div>
          <div style={{width:"40%", float:"right"}}>
              <PieChart highcharts={Highcharts} options={pieOptions} />
          </div>
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
        query:null,
        straindata:null
    }
    this.handleSearch = this.handleSearch.bind(this);
    this.asynchUpdate = this.asynchUpdate.bind(this);
  }

  handleSearch(q){
    //this.setState({query:q, straindata:null});
    this.asynchUpdate(q);
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.query!==this.props.query){
      //this.asynchUpdate();
    }
  }

  asynchUpdate(query){
      //var query = this.props.query;
      fetch('rest/straindata', {method: 'POST', headers: {'Content-Type': 'application/json'}, body:JSON.stringify(query)})
          .then((response) => response.json())
          .then((responseJson) => {
            console.log("got new data");
            this.setState({
              query: query,
              straindata: responseJson
            });
          })
          .catch((error) => {
            console.error(error);
          });
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
            <TheMap query={this.state.query} straindata={this.state.straindata} />
        </div>
        <div className="App-divider">
          Entries
        </div>
        <div className="divtable" id="divfortable">
          <TheTable query={this.state.query} straindata={this.state.straindata} />
        </div>
      </div>
    );
  }
}

//straindata={this.state.straindata}

export default App;





