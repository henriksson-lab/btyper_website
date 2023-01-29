import sqlite3 as sql
import pandas as pd

f = pd.read_csv("final_table_vIAFP.tsv",sep="\t")

#Describe columns
coldesc = pd.read_csv("column_desc.csv",sep="\t")

new_coldesc = pd.DataFrame(data={"column_id":f.columns})
new_coldesc["column_type"]="text"
new_coldesc["v1"]=""
new_coldesc["v2"]=""

new_coldesc = new_coldesc[~new_coldesc["column_id"].isin(set(coldesc["column_id"]))]

new_coldesc = pd.concat([coldesc,new_coldesc])

new_coldesc.to_csv("column_desc.csv2",sep="\t",index=False)

#print(~new_coldesc["column_id"].isin(set(coldesc["column_id"])))

print(new_coldesc)

#column_id	column_type	default	v1	v2
#sample	text	nosample	0	0
#strain	text	nostrain	0	0

conn = sql.connect('data.sqlite')
f.to_sql('straindata', conn, if_exists="replace", index=False)
conn.close()


