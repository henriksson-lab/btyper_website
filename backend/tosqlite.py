import sqlite3 as sql
import pandas as pd

f = pd.read_csv("btyperdb.tsv",sep="\t")

#Describe columns
#coldesc = pd.read_csv("db.v1/btyperdb_include.tsv",sep="\t")
#column  type    display search  print   notes

conn = sql.connect('data.sqlite')
f.to_sql('straindata', conn, if_exists="replace", index=False)
conn.close()


