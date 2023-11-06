from flask import Flask, render_template, send_from_directory, send_file, request, Response
import zipfly
import pandas as pd
import sqlite3 as sql
import json
from pathlib import Path


app = Flask(__name__)
#,static_folder='../build')

f = open("config.json", "r")
config = json.load(f)
f.close()

path_fna = Path(config["fnastore"])



################################################################################################
coldesc = pd.read_csv("btyperdb_include.tsv",sep="\t")
coldesc = coldesc.fillna("")

#TODO check these columns in the CSV: column_id       column_type     default_v1      default_v2

#TODO check types are valid. text integer float

#### Figure out what columns to keep for display, printing, etc
list_column_display = list(coldesc[coldesc["display"]==1]["column_id"])
list_column_search  = list(coldesc[coldesc["search"]==1]["column_id"])
list_column_print   = list(coldesc[coldesc["print"]==1]["column_id"])


#TODO check all columns present in sql


################################################################################################
# Cleaning of input data, for security
################################################################################################

#SQL fields
def cleanfieldname(s):
    return ''.join(c for c in s if c.isalpha() or c.isnumeric() or c=="(" or c==")" or c=="_" or c=="[" or c=="]" or c==" ")

#should be like BTDB_2022-0000002.1.fna
def cleanfilename(s):
    return ''.join(c for c in s if c.isalpha() or c.isnumeric() or c=="_" or c=="-" or c==".")


################################################################################################
#
################################################################################################
@app.route("/column_desc")
def get_column_desc():
    return coldesc.to_json(orient="records")



################################################################################################
#
################################################################################################
@app.route("/straindata", methods=['GET', 'POST'])
def get_straindata():

    #print(request.json)
    #print(request.json.keys)

    content = request.json["query"]  ### changed!!! 
    keep_display = request.json["keep_display"]
    keep_print   = request.json["keep_print"]  ### added
    keep_strains = None
    if "keep_strains" in request.json:
      keep_strains = request.json["keep_strains"]

    print(content)
    list_constraint=[]
    list_vars=[]
    for c in content:
        if c["column_type"]=="text":
            list_constraint.append(
                "\""+cleanfieldname(c["field"])+"\" = ?")
            list_vars.append(c["value"])
        elif c["column_type"]=="integer" or c["column_type"]=="float":
            list_constraint.append(
                "\""+cleanfieldname(c["field"])+"\""+
                " > ? and "+
                "\""+cleanfieldname(c["field"])+"\""+
                " < ?")
            list_vars.append(float(c["value"]))
            list_vars.append(float(c["value2"]))
        else:
            print("Got bad column type "+c["column_type"])

    constraint = " AND ".join(list_constraint)

    print("search")
    print(constraint)
    print(list_vars)

    #Extract data from SQL database
    conn = sql.connect('data.sqlite')
    cursor = conn.cursor()
    if constraint=="":
      if keep_strains is not None:
        cursor.execute("SELECT * from straindata")
      else:
        cursor.execute("SELECT * from straindata limit 100")
    else:
      cursor.execute("SELECT * from straindata where "+constraint, list_vars)
    df=pd.DataFrame(cursor.fetchall())
    conn.close()

    #Figure out output format
    outformat = None
    if "get_format" in request.json:
      outformat = request.json["get_format"]
    print(outformat)

    #Check if we got any data out of the database at all
    if df.shape[0]>0:
      #Extract column names
      num_fields = len(cursor.description)
      field_names = [i[0] for i in cursor.description]
      df.columns = field_names

      #Optionally remove columns, reduces amount of data sent
      to_keep_col = []
      if keep_display=="true":
         to_keep_col = to_keep_col + list_column_display
      if keep_print=="true":
         to_keep_col = to_keep_col + list_column_print
      to_keep_col = set(to_keep_col)
      df = df.drop(columns=[col for col in df if col not in to_keep_col])

      #If specified, only keep some strains
      if keep_strains is not None:
        #print(keep_strains)
        df = df[df["BTyperDB_ID"].isin(keep_strains)]

      #Return data
      if outformat == "text/csv":
        return df.to_csv()
      else:
        return df.to_json()
    else:
      #Return data; could make it have at least the name of columns line! TODO
      print("empty")
      if outformat == "text/csv":
        return ""
      else:
        return "[]"


################################################################################################
#
################################################################################################
@app.route("/getfasta", methods=['GET', 'POST'])
def getfasta():
    paths = []
    print("download")
    print(request.json)

    list_fasta = request.json
    for id in list_fasta:
        fs = path_fna / (cleanfilename(id)+".fna")
        print(fs)
        if fs.exists():
            paths.append({
                'fs': str(fs),
                'n': id+".fna"
            })
        else:
            print("Failed to find FNA file "+id+"  "+fs)

    zfly = zipfly.ZipFly(paths=paths)
    z = zfly.generator()

    response = Response(z, mimetype='application/zip', )
    response.headers['Content-Disposition'] = 'attachment; filename=file.zip'
    return response



################################################################################################
# Not used
################################################################################################
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
  '''Return index.html for all non-api routes'''
  #pylint: disable=unused-argument
  return "" #send_from_directory(app.static_folder, 'index.html')



if __name__ == "__main__":
    app.run(debug=True)
