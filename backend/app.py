from flask import Flask, render_template, send_from_directory, send_file, request
#from flask_cors import CORS

import pandas as pd
import sqlite3 as sql


app = Flask(__name__)
#,static_folder='../build')
#CORS(app)



@app.route("/column_desc")
def column_desc():
    f = pd.read_csv("column_desc.csv2",sep="\t")
    #print(f.to_json(orient="records"))
    return f.to_json(orient="records")
    #return send_file('column_desc.csv')


def formatOneConstraint(c):
    #if c["type"]:
    c.field

#[{'field': 'strain', 'value': 'nostrain', 'value2': 0, 'id': 5}, {'field': 'strain', 'value': 'nostrain', 'value2': 0, 'id': 5}, {'field': 'N50', 'value': '20000', 'value2': 1000000, 'id': 6}, {'field': 'N50', 'value': '20000', 'value2': 1000000, 'id': 6}, {'field': 'Completeness', 'value': '95', 'value2': 100, 'id': 7}, {'field': 'Completeness', 'value': '95', 'value2': 100, 'id': 7}, {'field': 'Contamination', 'value': '0', 'value2': 5, 'id': 8}, {'field': 'Contamination', 'value': '0', 'value2': 5, 'id': 8}]

@app.route("/straindata", methods=['GET', 'POST'])
def gettable():
    content = request.json
    print(content)
    list_constraint=[]
    list_vars=[]
    for c in content:
      list_constraint.append("? = ?")
      list_vars.append(c["field"])
      list_vars.append(c["value"])

    constraint = " AND ".join(list_constraint)
#    if constraint=="":
#      constraint="*"

    print(constraint)
    print(list_vars)

    conn = sql.connect('data.sqlite')
    cursor = conn.cursor()
    if constraint=="":
      cursor.execute("SELECT * from straindata limit 100")
    else:
      cursor.execute("SELECT * from straindata where "+constraint+" limit 100", list_vars)
#    df = pd.read_sql_query("SELECT "+constraint+" from straindata limit 100", conn, paramrs)
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




@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
  '''Return index.html for all non-api routes'''
  #pylint: disable=unused-argument
  return send_from_directory(app.static_folder, 'index.html')



if __name__ == "__main__":
    app.run(debug=True)
