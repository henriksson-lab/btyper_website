rung:
#	gunicorn app:server -b :8099 -n btyper
	gunicorn app:app -b :5198 -n btyper
	#flask --app app run --host=0.0.0.0:8099

install:
	pip install -r requirements.txt

upload:
	scp column_desc.csv high_quality_bc_temp_for_johan.tsv beagle.henlab.org:/home/carroll/site/btyper/backend/
