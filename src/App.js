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

"Afghanistan": "af",
"Albania": "al",
"Algeria": "dz",
"American Samoa": "as",
"Andorra": "ad",
"Angola": "ao",
"Anguilla": "ai",
"Antarctica": "aq",
"Antigua and Barbuda": "ag",
"Argentina": "ar",
"Armenia": "am",
"Aruba": "aw",
"Australia": "au",
"Austria": "at",
"Azerbaijan": "az",
"Bahamas (the)": "bs",
"Bahrain": "bh",
"Bangladesh": "bd",
"Barbados": "bb",
"Belarus": "by",
"Belgium": "be",
"Belize": "bz",
"Benin": "bj",
"Bermuda": "bm",
"Bhutan": "bt",
"Bolivia": "bo",
"Bonaire, Sint Eustatius and Saba": "bq",
"Bosnia and Herzegovina": "ba",
"Botswana": "bw",
"Bouvet Island": "bv",
"Brazil": "br",
"British Indian Ocean Territory (the)": "io",
"Brunei Darussalam": "bn",
"Bulgaria": "bg",
"Burkina Faso": "bf",
"Burundi": "bi",
"Cabo Verde": "cv",
"Cambodia": "kh",
"Cameroon": "cm",
"Canada": "ca",
"Cayman Islands (the)": "ky",
"Central African Republic (the)": "cf",
"Chad": "td",
"Chile": "cl",
"China": "cn",
"Christmas Island": "cx",
"Cocos (Keeling) Islands (the)": "cc",
"Colombia": "co",
"Comoros (the)": "km",
"Congo (the Democratic Republic of the)": "cd",
"Congo (the)": "cg",
"Cook Islands (the)": "ck",
"Costa Rica": "cr",
"Croatia": "hr",
"Cuba": "cu",
"Curaçao": "cw",
"Cyprus": "cy",
"Czechia": "cz",
"Côte d'Ivoire": "ci",
"Denmark": "dk",
"Djibouti": "dj",
"Dominica": "dm",
"Dominican Republic (the)": "do",
"Ecuador": "ec",
"Egypt": "eg",
"El Salvador": "sv",
"Equatorial Guinea": "gq",
"Eritrea": "er",
"Estonia": "ee",
"Eswatini": "sz",
"Ethiopia": "et",
"Falkland Islands (the) [Malvinas]": "fk",
"Faroe Islands (the)": "fo",
"Fiji": "fj",
"Finland": "fi",
"France": "fr",
"French Guiana": "gf",
"French Polynesia": "pf",
"French Southern Territories (the)": "tf",
"Gabon": "ga",
"Gambia (the)": "gm",
"Georgia": "ge",
"Germany": "de",
"Ghana": "gh",
"Gibraltar": "gi",
"Greece": "gr",
"Greenland": "gl",
"Grenada": "gd",
"Guadeloupe": "gp",
"Guam": "gu",
"Guatemala": "gt",
"Guernsey": "gg",
"Guinea": "gn",
"Guinea-Bissau": "gw",
"Guyana": "gy",
"Haiti": "ht",
"Heard Island and McDonald Islands": "hm",
"Holy See (the)": "va",
"Honduras": "hn",
"Hong Kong": "hk",
"Hungary": "hu",
"Iceland": "is",
"India": "in",
"Indonesia": "id",
"Iran": "ir",
"Iraq": "iq",
"Ireland": "ie",
"Isle of Man": "im",
"Israel": "il",
"Italy": "it",
"Jamaica": "jm",
"Japan": "jp",
"Jersey": "je",
"Jordan": "jo",
"Kazakhstan": "kz",
"Kenya": "ke",
"Kiribati": "ki",
"Korea (the Democratic People's Republic of)": "kp",
"South Korea": "kr",
"Kuwait": "kw",
"Kyrgyzstan": "kg",
"Lao People's Democratic Republic (the)": "la",
"Latvia": "lv",
"Lebanon": "lb",
"Lesotho": "ls",
"Liberia": "lr",
"Libya": "ly",
"Liechtenstein": "li",
"Lithuania": "lt",
"Luxembourg": "lu",
"Macao": "mo",
"Madagascar": "mg",
"Malawi": "mw",
"Malaysia": "my",
"Maldives": "mv",
"Mali": "ml",
"Malta": "mt",
"Marshall Islands (the)": "mh",
"Martinique": "mq",
"Mauritania": "mr",
"Mauritius": "mu",
"Mayotte": "yt",
"Mexico": "mx",
"Micronesia (Federated States of)": "fm",
"Moldova (the Republic of)": "md",
"Monaco": "mc",
"Mongolia": "mn",
"Montenegro": "me",
"Montserrat": "ms",
"Morocco": "ma",
"Mozambique": "mz",
"Myanmar": "mm",
"Namibia": "na",
"Nauru": "nr",
"Nepal": "np",
"Netherlands": "nl",
"New Caledonia": "nc",
"New Zealand": "nz",
"Nicaragua": "ni",
"Niger (the)": "ne",
"Nigeria": "ng",
"Niue": "nu",
"Norfolk Island": "nf",
"Northern Mariana Islands (the)": "mp",
"Norway": "no",
"Oman": "om",
"Pakistan": "pk",
"Palau": "pw",
"Palestine, State of": "ps",
"Panama": "pa",
"Papua New Guinea": "pg",
"Paraguay": "py",
"Peru": "pe",
"Philippines (the)": "ph",
"Pitcairn": "pn",
"Poland": "pl",
"Portugal": "pt",
"Puerto Rico": "pr",
"Qatar": "qa",
"Republic of North Macedonia": "mk",
"Romania": "ro",
"Russian Federation": "ru",
"Rwanda": "rw",
"Réunion": "re",
"Saint Barthélemy": "bl",
"Saint Helena, Ascension and Tristan da Cunha": "sh",
"Saint Kitts and Nevis": "kn",
"Saint Lucia": "lc",
"Saint Martin (French part)": "mf",
"Saint Pierre and Miquelon": "pm",
"Saint Vincent and the Grenadines": "vc",
"Samoa": "ws",
"San Marino": "sm",
"Sao Tome and Principe": "st",
"Saudi Arabia": "sa",
"Senegal": "sn",
"Serbia": "rs",
"Seychelles": "sc",
"Sierra Leone": "sl",
"Singapore": "sg",
"Sint Maarten (Dutch part)": "sx",
"Slovakia": "sk",
"Slovenia": "si",
"Solomon Islands": "sb",
"Somalia": "so",
"South Africa": "za",
"South Georgia and the South Sandwich Islands": "gs",
"South Sudan": "ss",
"Spain": "es",
"Sri Lanka": "lk",
"Sudan (the)": "sd",
"Suriname": "sr",
"Svalbard and Jan Mayen": "sj",
"Sweden": "se",
"Switzerland": "ch",
"Syrian Arab Republic": "sy",
"Taiwan": "tw",
"Tajikistan": "tj",
"Tanzania": "tz",
"Thailand": "th",
"Timor-Leste": "tl",
"Togo": "tg",
"Tokelau": "tk",
"Tonga": "to",
"Trinidad and Tobago": "tt",
"Tunisia": "tn",
"Turkey": "tr",
"Turkmenistan": "tm",
"Turks and Caicos Islands (the)": "tc",
"Tuvalu": "tv",
"Uganda": "ug",
"Ukraine": "ua",
"United Arab Emirates (the)": "ae",
"United Kingdom": "gb",
"United States Minor Outlying Islands (the)": "um",
"United States": "us",
"Uruguay": "uy",
"Uzbekistan": "uz",
"Vanuatu": "vu",
"Venezuela (Bolivarian Republic of)": "ve",
"Vietnam": "vn",
"Virgin Islands (British)": "vg",
"Virgin Islands (U.S.)": "vi",
"Wallis and Futuna": "wf",
"Western Sahara": "eh",
"Yemen": "ye",
"Zambia": "zm",
"Zimbabwe": "zw",
"Åland Islands": "ax",

//added extra entries
"Czechoslovakia (Historic)": "cz",
"Iran, Islamic Republic of": "ir",

//// Edited entries. these are original
"Russian Federation (the)": "ru",
"Iran (Islamic Republic of)": "ir",
"Tanzania, United Republic of": "tz",
"United States of America (the)": "us",
"United Kingdom of Great Britain and Northern Ireland (the)": "gb",
"Korea (the Republic of)": "kr",
"Netherlands (the)": "nl",
"Taiwan (Province of China)": "tw",
"Bolivia (Plurinational State of)": "bo",
"Viet Nam": "vn"
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
    var list_undef_country = list_country.map((e) => (e in dict_country2code) ? "":e );
    //Count for each country
    const counts2 = {};
    for (const num of list_undef_country) {
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





