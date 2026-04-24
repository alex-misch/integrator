docker exec integrator_db psql -U integrator -d integrator -At -c "$1"
