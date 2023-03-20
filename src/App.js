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
                    "BTyperDB_ID",
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
    this.addFilterNamed(["BTyperDB_ID"]);
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
    var num_rows = Object.keys(straindata["BTyperDB_ID"]).length;  //ugly. should not have row indices on each entry
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
                           checked={this.state.selected.includes(straindata["BTyperDB_ID"][row_i])}
                           value={straindata["BTyperDB_ID"][row_i]}
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



var dict_country2code={

"AFG": "af",
"ALB": "al",
"DZA": "dz",
"ASM": "as",
"AND": "ad",
"AGO": "ao",
"AIA": "ai",
"ATA": "aq",
"ATG": "ag",
"ARG": "ar",
"ARM": "am",
"ABW": "aw",
"AUS": "au",
"AUT": "at",
"AZE": "az",
"BHS": "bs",
"BHR": "bh",
"BGD": "bd",
"BRB": "bb",
"BLR": "by",
"BEL": "be",
"BLZ": "bz",
"BEN": "bj",
"BMU": "bm",
"BTN": "bt",
"BOL": "bo",
"BES": "bq",
"BIH": "ba",
"BWA": "bw",
"BVT": "bv",
"BRA": "br",
"IOT": "io",
"BRN": "bn",
"BGR": "bg",
"BFA": "bf",
"BDI": "bi",
"CPV": "cv",
"KHM": "kh",
"CMR": "cm",
"CAN": "ca",
"CYM": "ky",
"CAF": "cf",
"TCD": "td",
"CHL": "cl",
"CHN": "cn",
"CXR": "cx",
"CCK": "cc",
"COL": "co",
"COM": "km",
"COD": "cd",
"COG": "cg",
"COK": "ck",
"CRI": "cr",
"HRV": "hr",
"CUB": "cu",
"CUW": "cw",
"CYP": "cy",
"CZE": "cz",
"CIV": "ci",
"DNK": "dk",
"DJI": "dj",
"DMA": "dm",
"DOM": "do",
"ECU": "ec",
"EGY": "eg",
"SLV": "sv",
"GNQ": "gq",
"ERI": "er",
"EST": "ee",
"SWZ": "sz",
"ETH": "et",
"FLK": "fk",
"FRO": "fo",
"FJI": "fj",
"FIN": "fi",
"FRA": "fr",
"GUF": "gf",
"PYF": "pf",
"ATF": "tf",
"GAB": "ga",
"GMB": "gm",
"GEO": "ge",
"DEU": "de",
"GHA": "gh",
"GIB": "gi",
"GRC": "gr",
"GRL": "gl",
"GRD": "gd",
"GLP": "gp",
"GUM": "gu",
"GTM": "gt",
"GGY": "gg",
"GIN": "gn",
"GNB": "gw",
"GUY": "gy",
"HTI": "ht",
"HMD": "hm",
"VAT": "va",
"HND": "hn",
"HKG": "hk",
"HUN": "hu",
"ISL": "is",
"IND": "in",
"IDN": "id",
"IRN": "ir",
"IRQ": "iq",
"IRL": "ie",
"IMN": "im",
"ISR": "il",
"ITA": "it",
"JAM": "jm",
"JPN": "jp",
"JEY": "je",
"JOR": "jo",
"KAZ": "kz",
"KEN": "ke",
"KIR": "ki",
"PRK": "kp",
"KOR": "kr",
"KWT": "kw",
"KGZ": "kg",
"LAO": "la",
"LVA": "lv",
"LBN": "lb",
"LSO": "ls",
"LBR": "lr",
"LBY": "ly",
"LIE": "li",
"LTU": "lt",
"LUX": "lu",
"MAC": "mo",
"MDG": "mg",
"MWI": "mw",
"MYS": "my",
"MDV": "mv",
"MLI": "ml",
"MLT": "mt",
"MHL": "mh",
"MTQ": "mq",
"MRT": "mr",
"MUS": "mu",
"MYT": "yt",
"MEX": "mx",
"FSM": "fm",
"MDA": "md",
"MCO": "mc",
"MNG": "mn",
"MNE": "me",
"MSR": "ms",
"MAR": "ma",
"MOZ": "mz",
"MMR": "mm",
"NAM": "na",
"NRU": "nr",
"NPL": "np",
"NLD": "nl",
"NCL": "nc",
"NZL": "nz",
"NIC": "ni",
"NER": "ne",
"NGA": "ng",
"NIU": "nu",
"NFK": "nf",
"MNP": "mp",
"NOR": "no",
"OMN": "om",
"PAK": "pk",
"PLW": "pw",
"PSE": "ps",
"PAN": "pa",
"PNG": "pg",
"PRY": "py",
"PER": "pe",
"PHL": "ph",
"PCN": "pn",
"POL": "pl",
"PRT": "pt",
"PRI": "pr",
"QAT": "qa",
"MKD": "mk",
"ROU": "ro",
"RUS": "ru",
"RWA": "rw",
"REU": "re",
"BLM": "bl",
"SHN": "sh",
"KNA": "kn",
"LCA": "lc",
"MAF": "mf",
"SPM": "pm",
"VCT": "vc",
"WSM": "ws",
"SMR": "sm",
"STP": "st",
"SAU": "sa",
"SEN": "sn",
"SRB": "rs",
"SYC": "sc",
"SLE": "sl",
"SGP": "sg",
"SXM": "sx",
"SVK": "sk",
"SVN": "si",
"SLB": "sb",
"SOM": "so",
"ZAF": "za",
"SGS": "gs",
"SSD": "ss",
"ESP": "es",
"LKA": "lk",
"SDN": "sd",
"SUR": "sr",
"SJM": "sj",
"SWE": "se",
"CHE": "ch",
"SYR": "sy",
"TWN": "tw",
"TJK": "tj",
"TZA": "tz",
"THA": "th",
"TLS": "tl",
"TGO": "tg",
"TKL": "tk",
"TON": "to",
"TTO": "tt",
"TUN": "tn",
"TUR": "tr",
"TKM": "tm",
"TCA": "tc",
"TUV": "tv",
"UGA": "ug",
"UKR": "ua",
"ARE": "ae",
"GBR": "gb",
"UMI": "um",
"USA": "us",
"URY": "uy",
"UZB": "uz",
"VUT": "vu",
"VEN": "ve",
"VNM": "vn",
"VGB": "vg",
"VIR": "vi",
"WLF": "wf",
"ESH": "eh",
"YEM": "ye",
"ZMB": "zm",
"ZWE": "zw",
"ALA": "ax"
};


class TheMap extends React.Component {
  constructor(props) {
    super(props);

    this.data=[];
  }


  render() {

    this.data=[];

    //Collect counts
    var straindata = this.props.straindata;
    if(straindata != null){

    var list_country = Object.values(straindata["Country_Code"]);

    //check which are not in list
//    var list_undef_country = list_country;
    list_country.map((e) => (e in dict_country2code) ? "":e );

    //Count for each country
    const counts2 = {};
    for (const num of list_country) {
        counts2[num] = counts2[num] ? counts2[num] + 1 : 1;
    }
    console.log(999);
    console.log(counts2);

//for some reason both "" and null in this list

    //Map country to 2-char code. Some will be mapped to undefined likely, and thus merged
    list_country = list_country.map((e) => dict_country2code[e] );

    //Count for each country
    const counts = {};
    for (const num of list_country) {
        counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    console.log(counts);

    //Format of data is: [[country,count],[country,count]]
    var arr = [];
    for (var key in counts) {
        if (counts.hasOwnProperty(key)) {
            arr.push( [ key, counts[key] ] );
        }
    }
    this.data = arr;
    }

    //More map options
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





