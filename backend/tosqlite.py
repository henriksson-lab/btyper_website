import sqlite3 as sql
import pandas as pd

f = pd.read_csv("column_desc.csv",sep="\t")

conn = sql.connect('data.sqlite')
f.to_sql('straindata', conn, if_exists="replace")
conn.close()
