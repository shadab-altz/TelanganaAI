--------

CREATE OR REPLACE FUNCTION sp_getTelanganaBoundary() 
returns table (sp_state_name character varying, sp_geometry text) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	SELECT state_name, ST_AsGeoJSON(ST_Transform(geom, 3857)) FROM telangana;
END;
$$;

--------

CREATE OR REPLACE FUNCTION sp_getTelanganaCameraTrapLocations(sp_month character varying) 
returns table (sp_camera character varying, sp_rotation integer, sp_geometry text) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('select DISTINCT(camera), rotation, ST_AsGeoJSON(ST_Transform(location, 3857)) FROM %s GROUP BY camera, rotation, location', sp_month);
END;
$$;


---------- Get Ranges


CREATE OR REPLACE FUNCTION sp_getRanges(sp_month character varying) 
returns table (sp_range character varying) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('select DISTINCT(range) FROM %s', sp_month);
END;
$$;


--------- UPDATE the Rotation Column


CREATE OR REPLACE FUNCTION public.update_records()
    RETURNS character varying
    LANGUAGE 'plpgsql'    
AS $BODY$

DECLARE
ref refcursor;
rec RECORD;
err text;
sp_rotation integer;
BEGIN 

FOR rec IN  
	SELECT DISTINCT(camera) FROM february
    LOOP 
		sp_rotation = floor(random()* (360-0 + 1) + 0);
	UPDATE february SET rotation = sp_rotation WHERE camera = rec.camera;
    END LOOP;
RETURN 'DONE';
END;
$BODY$;