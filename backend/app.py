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
#
################################################################################################
@app.route("/column_desc")
def column_desc():
    f = pd.read_csv("column_desc.csv2",sep="\t")
    f = f.fillna("")
    #print(f.to_json(orient="records"))
    return f.to_json(orient="records")
    #return send_file('column_desc.csv')


def cleanfieldname(s):
    return ''.join(c for c in s if c.isalpha() or c.isnumeric() or c=="(" or c==")")
        #''.join(filter(str.isalpha, s))

################################################################################################
#
################################################################################################
@app.route("/straindata", methods=['GET', 'POST'])
def gettable():
    content = request.json
    print(content)
    list_constraint=[]
    list_vars=[]
    for c in content:
        if c["column_type"]=="text":
            list_constraint.append(
                "\""+cleanfieldname(c["field"])+"\" = ?")
            list_vars.append(c["value"])
        elif c["column_type"]=="number":
            list_constraint.append(
                "\""+cleanfieldname(c["field"])+"\""+
                " > ? and "+
                "\""+cleanfieldname(c["field"])+"\""+
                " < ?")
            list_vars.append(float(c["value"]))
            list_vars.append(float(c["value2"]))
            """
            list_constraint.append("? > ? and ? < ?")
            list_vars.append(c["field"])
            list_vars.append(float(c["value"]))
            list_vars.append(c["field"])
            list_vars.append(float(c["value2"]))
            """
        else:
            print("Got bad column type "+c["column_type"])

    constraint = " AND ".join(list_constraint)

    print("search")
    print(constraint)
    print(list_vars)

    conn = sql.connect('data.sqlite')
    cursor = conn.cursor()
    if constraint=="":
      cursor.execute("SELECT * from straindata limit 100")
    else:
      cursor.execute("SELECT * from straindata where "+constraint, list_vars)
    df=pd.DataFrame(cursor.fetchall())

    conn.close()

    if df.shape[0]>0:
      num_fields = len(cursor.description)
      field_names = [i[0] for i in cursor.description]
      df.columns= field_names
      print(df)
      return df.to_json()
    else:
      print("empty")
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
        # TODO clean up id content
        fs = path_fna / (id+".fna")
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
