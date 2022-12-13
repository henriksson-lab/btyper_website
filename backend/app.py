from flask import Flask, render_template, send_from_directory, send_file
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


@app.route("/straindata")
def gettable():
    conn = sql.connect('data.sqlite')
    df = pd.read_sql_query("SELECT * from straindata limit 100", conn)
    conn.close()
    return df.to_json()




@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
  '''Return index.html for all non-api routes'''
  #pylint: disable=unused-argument
  return send_from_directory(app.static_folder, 'index.html')



if __name__ == "__main__":
    app.run(debug=True)
